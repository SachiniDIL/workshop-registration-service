import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Workshop } from "@/models/Workshop";
import { Registration, type IRegistration } from "@/models/Registration";
import { unauthorizedResponse } from "@/lib/apiAuth";

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

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireRole(["manager", "staff"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  const { id } = await params;

  await connectToDatabase();

  const registration = await Registration.findById(id).catch(() => null);
  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  if (registration.status === "cancelled") {
    return NextResponse.json({ error: "Registration is already cancelled" }, { status: 400 });
  }

  registration.status = "cancelled";
  registration.cancelledBy = new mongoose.Types.ObjectId(check.user.id);
  registration.cancelledAt = new Date();
  await registration.save();

  // Atomically release the seat, floored at 0 so it can never go negative.
  await Workshop.findByIdAndUpdate(
    registration.workshopId,
    [{ $set: { activeCount: { $max: [{ $subtract: ["$activeCount", 1] }, 0] } } }],
    { updatePipeline: true }
  );

  return NextResponse.json(toRegistrationResponse(registration), { status: 200 });
}
