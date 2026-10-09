import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { validateCreateUser } from "@/lib/validation";
import { unauthorizedResponse } from "@/lib/apiAuth";

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

export async function POST(request: NextRequest) {
  const check = await requireRole(["admin"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  const body = await request.json().catch(() => null);
  const result = validateCreateUser(body);
  if (!result.valid) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  await connectToDatabase();

  const existing = await User.findOne({ email: result.data.email });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(result.data.password, 10);

  const user = await User.create({
    name: result.data.name,
    email: result.data.email,
    passwordHash,
    role: result.data.role,
  });

  return NextResponse.json(toUserResponse(user), { status: 201 });
}

export async function GET() {
  const check = await requireRole(["admin"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  await connectToDatabase();

  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });

  return NextResponse.json(users.map(toUserResponse), { status: 200 });
}
