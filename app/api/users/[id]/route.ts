import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { USER_ROLES, isRecord, type UserRole } from "@/lib/validation";
import { unauthorizedResponse } from "@/lib/apiAuth";

interface UpdateUserInput {
  name?: string;
  role?: UserRole;
}

function validateUpdateUser(input: unknown): { valid: true; data: UpdateUserInput } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  if (input.name === undefined && input.role === undefined) {
    return { valid: false, errors: ["At least one field must be provided: name, role"] };
  }

  const data: UpdateUserInput = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      errors.push("name must be a non-empty string");
    } else {
      data.name = input.name.trim();
    }
  }

  if (input.role !== undefined) {
    if (typeof input.role !== "string" || !USER_ROLES.includes(input.role as UserRole)) {
      errors.push(`role must be one of: ${USER_ROLES.join(", ")}`);
    } else {
      data.role = input.role as UserRole;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

function toUserResponse(user: { _id: unknown; name: string; email: string; role: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireRole(["admin"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const result = validateUpdateUser(body);
  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findById(id).catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (result.data.name !== undefined) {
    user.name = result.data.name;
  }

  const previousRole = user.role;
  if (result.data.role !== undefined) {
    user.role = result.data.role;
  }

  await user.save();

  if (result.data.role !== undefined && result.data.role !== previousRole) {
    await AuditLog.create({
      action: "user.role_changed",
      entityType: "user",
      entityId: user._id,
      performedBy: check.user.id,
      performedAt: new Date(),
      details: { before: { role: previousRole }, after: { role: result.data.role } },
    });
  }

  return NextResponse.json(toUserResponse(user), { status: 200 });
}
