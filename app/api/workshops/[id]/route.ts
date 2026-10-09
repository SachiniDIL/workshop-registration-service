import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Workshop, type IWorkshop } from "@/models/Workshop";
import { validateUpdateWorkshop } from "@/lib/validation";
import { unauthorizedResponse } from "@/lib/apiAuth";

function toWorkshopResponse(workshop: IWorkshop) {
  return {
    id: String(workshop._id),
    code: workshop.code,
    title: workshop.title,
    instructor: workshop.instructor,
    dateTime: workshop.dateTime,
    capacity: workshop.capacity,
    activeCount: workshop.activeCount,
    seatsAvailable: workshop.capacity - workshop.activeCount,
    status: workshop.status,
    location: workshop.location,
    description: workshop.description,
    createdBy: String(workshop.createdBy),
    createdAt: workshop.createdAt,
    updatedAt: workshop.updatedAt,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireRole(["manager"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const result = validateUpdateWorkshop(body);
  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  await connectToDatabase();

  const workshop = await Workshop.findById(id).catch(() => null);
  if (!workshop) {
    return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  }

  const { data } = result;
  if (data.code !== undefined) workshop.code = data.code;
  if (data.title !== undefined) workshop.title = data.title;
  if (data.instructor !== undefined) workshop.instructor = data.instructor;
  if (data.dateTime !== undefined) workshop.dateTime = data.dateTime;
  if (data.capacity !== undefined) workshop.capacity = data.capacity;
  if (data.status !== undefined) workshop.status = data.status;
  if (data.location !== undefined) workshop.location = data.location;
  if (data.description !== undefined) workshop.description = data.description;

  await workshop.save();

  return NextResponse.json(toWorkshopResponse(workshop), { status: 200 });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireRole(["admin", "manager", "staff"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  const { id } = await params;

  await connectToDatabase();

  const workshop = await Workshop.findById(id).catch(() => null);
  if (!workshop) {
    return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  }

  return NextResponse.json(toWorkshopResponse(workshop), { status: 200 });
}
