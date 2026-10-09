import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type AuditAction = "workshop.updated" | "user.role_changed";
export type AuditEntityType = "workshop" | "user";

export interface IAuditLog extends Document {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: Types.ObjectId;
  performedBy: Types.ObjectId;
  performedAt: Date;
  details?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, enum: ["workshop.updated", "user.role_changed"], required: true },
  entityType: { type: String, enum: ["workshop", "user"], required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  performedAt: { type: Date, required: true },
  details: { type: Schema.Types.Mixed },
});

AuditLogSchema.index({ performedAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
