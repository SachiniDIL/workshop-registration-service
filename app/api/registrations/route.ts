import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Workshop } from "@/models/Workshop";
import { Registration, type IRegistration } from "@/models/Registration";
import { validateCreateRegistration, isRecord } from "@/lib/validation";
import { unauthorizedResponse } from "@/lib/apiAuth";
import mongoose from "mongoose";

function toRegistrationResponse(registration: IRegistration) {
  return {
    id: String(registration._id),
    workshopId: String(registration.workshopId),
    attendeeName: registration.attendeeName,
    attendeeEmail: registration.attendeeEmail,
    status: registration.status,
    registeredBy: String(registration.registeredBy),
    registeredAt: registration.registeredAt,
    cancelledBy: registration.cancelledBy ? String(registration.cancelledBy) : undefined,
    cancelledAt: registration.cancelledAt,
  };
}

export async function POST(request: NextRequest) {
  const check = await requireRole(["manager", "staff"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  const body = await request.json().catch(() => null);

  if (!isRecord(body) || typeof body.workshopId !== "string" || body.workshopId.trim().length === 0) {
    return NextResponse.json({ errors: ["workshopId is required and must be a non-empty string"] }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(body.workshopId)) {
    return NextResponse.json({ errors: ["workshopId must be a valid id"] }, { status: 400 });
  }

  const result = validateCreateRegistration(body);
  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const workshopId = body.workshopId;

  await connectToDatabase();

  // Atomically reserve a seat: only succeeds if the workshop exists and activeCount < capacity.
  const workshop = await Workshop.findOneAndUpdate(
    { _id: workshopId, $expr: { $lt: ["$activeCount", "$capacity"] } },
    { $inc: { activeCount: 1 } },
    { returnDocument: "after" }
  );

  if (!workshop) {
    return NextResponse.json({ error: "Workshop is full or not found" }, { status: 409 });
  }

  try {
    const registration = await Registration.create({
      workshopId,
      attendeeName: result.data.attendeeName,
      attendeeEmail: result.data.attendeeEmail,
      status: "active",
      registeredBy: check.user.id,
      registeredAt: new Date(),
    });

    return NextResponse.json(toRegistrationResponse(registration), { status: 201 });
  } catch (error) {
    // Roll back the seat reservation since the Registration record failed to save.
    await Workshop.updateOne({ _id: workshopId }, { $inc: { activeCount: -1 } });
    console.error("Failed to create registration after reserving a seat:", error);
    return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const check = await requireRole(["admin", "manager", "staff"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  const workshopId = request.nextUrl.searchParams.get("workshopId");
  if (!workshopId || !mongoose.Types.ObjectId.isValid(workshopId)) {
    return NextResponse.json({ error: "workshopId query parameter is required and must be a valid id" }, { status: 400 });
  }

  await connectToDatabase();

  const registrations = await Registration.find({ workshopId })
    .sort({ registeredAt: -1 })
    .populate("registeredBy", "name email role")
    .populate("cancelledBy", "name email role");

  return NextResponse.json(
    registrations.map((registration) => ({
      id: String(registration._id),
      workshopId: String(registration.workshopId),
      attendeeName: registration.attendeeName,
      attendeeEmail: registration.attendeeEmail,
      status: registration.status,
      registeredBy: registration.registeredBy,
      registeredAt: registration.registeredAt,
      cancelledBy: registration.cancelledBy ?? undefined,
      cancelledAt: registration.cancelledAt ?? undefined,
    })),
    { status: 200 }
  );
}
