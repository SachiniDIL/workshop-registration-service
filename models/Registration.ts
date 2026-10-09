import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type RegistrationStatus = "active" | "cancelled";

export interface IRegistration extends Document {
  workshopId: Types.ObjectId;
  attendeeName: string;
  attendeeEmail: string;
  status: RegistrationStatus;
  registeredBy: Types.ObjectId;
  registeredAt: Date;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
}

const RegistrationSchema = new Schema<IRegistration>({
  workshopId: { type: Schema.Types.ObjectId, ref: "Workshop", required: true },
  attendeeName: { type: String, required: true },
  attendeeEmail: { type: String, required: true },
  status: { type: String, enum: ["active", "cancelled"], required: true },
  registeredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  registeredAt: { type: Date, required: true },
  cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
  cancelledAt: { type: Date },
});

RegistrationSchema.index({ workshopId: 1 });
RegistrationSchema.index({ status: 1 });

export const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;
