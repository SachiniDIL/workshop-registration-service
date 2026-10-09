import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Workshop, type IWorkshop } from "@/models/Workshop";
import { validateCreateWorkshop } from "@/lib/validation";
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

export async function POST(request: NextRequest) {
  const check = await requireRole(["manager"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  const body = await request.json().catch(() => null);
  const result = validateCreateWorkshop(body);
  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  await connectToDatabase();

  const existing = await Workshop.findOne({ code: result.data.code });
  if (existing) {
    return NextResponse.json({ error: "A workshop with this code already exists" }, { status: 409 });
  }

  const workshop = await Workshop.create({
    code: result.data.code,
    title: result.data.title,
    instructor: result.data.instructor,
    dateTime: result.data.dateTime,
    capacity: result.data.capacity,
    status: result.data.status,
    location: result.data.location,
    description: result.data.description,
    createdBy: check.user.id,
  });

  return NextResponse.json(toWorkshopResponse(workshop), { status: 201 });
}

export async function GET() {
  const check = await requireRole(["admin", "manager", "staff"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  await connectToDatabase();

  const workshops = await Workshop.find().sort({ dateTime: 1 });

  return NextResponse.json(workshops.map(toWorkshopResponse), { status: 200 });
}
