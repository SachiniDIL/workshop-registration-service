import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { AuditLog, type IAuditLog } from "@/models/AuditLog";
import { unauthorizedResponse } from "@/lib/apiAuth";

export async function GET() {
  const check = await requireRole(["admin"]);
  if (!check.ok) {
    return unauthorizedResponse(check.status);
  }

  await connectToDatabase();

  const logs = await AuditLog.find()
    .sort({ performedAt: -1 })
    .populate("performedBy", "name email role");

  return NextResponse.json(
    logs.map((log: IAuditLog) => ({
      id: String(log._id),
      action: log.action,
      entityType: log.entityType,
      entityId: String(log.entityId),
      performedBy: log.performedBy,
      performedAt: log.performedAt,
      details: log.details,
    })),
    { status: 200 }
  );
}
