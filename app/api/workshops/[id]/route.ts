import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Workshop, type IWorkshop } from "@/models/Workshop";
import { AuditLog } from "@/models/AuditLog";
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
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};

  if (data.code !== undefined && data.code !== workshop.code) {
    before.code = workshop.code;
    after.code = data.code;
    workshop.code = data.code;
  }
  if (data.title !== undefined && data.title !== workshop.title) {
    before.title = workshop.title;
    after.title = data.title;
    workshop.title = data.title;
  }
  if (data.instructor !== undefined && data.instructor !== workshop.instructor) {
    before.instructor = workshop.instructor;
    after.instructor = data.instructor;
    workshop.instructor = data.instructor;
  }
  // Compared at minute granularity: the edit form's <input type="datetime-local"> can only
  // express minutes, so a round-trip through it always drops seconds/ms — comparing exact
  // getTime() would register that precision loss as a change even when the user never
  // touched the date/time field.
  if (
    data.dateTime !== undefined &&
    Math.floor(data.dateTime.getTime() / 60000) !== Math.floor(workshop.dateTime.getTime() / 60000)
  ) {
    before.dateTime = workshop.dateTime;
    after.dateTime = data.dateTime;
    workshop.dateTime = data.dateTime;
  } else if (data.dateTime !== undefined) {
    workshop.dateTime = data.dateTime;
  }
  if (data.capacity !== undefined && data.capacity !== workshop.capacity) {
    before.capacity = workshop.capacity;
    after.capacity = data.capacity;
    workshop.capacity = data.capacity;
  }
  if (data.status !== undefined && data.status !== workshop.status) {
    before.status = workshop.status;
    after.status = data.status;
    workshop.status = data.status;
  }
  if (data.location !== undefined && data.location !== workshop.location) {
    before.location = workshop.location;
    after.location = data.location;
    workshop.location = data.location;
  }
  if (data.description !== undefined && data.description !== workshop.description) {
    before.description = workshop.description;
    after.description = data.description;
    workshop.description = data.description;
  }

  await workshop.save();

  if (Object.keys(after).length > 0) {
    await AuditLog.create({
      action: "workshop.updated",
      entityType: "workshop",
      entityId: workshop._id,
      performedBy: check.user.id,
      performedAt: new Date(),
      details: { before, after },
    });
  }

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
