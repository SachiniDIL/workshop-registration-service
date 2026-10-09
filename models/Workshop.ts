import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type WorkshopStatus = "scheduled" | "cancelled" | "completed";

export interface IWorkshop extends Document {
  code: string;
  title: string;
  instructor: string;
  dateTime: Date;
  capacity: number;
  activeCount: number;
  status: WorkshopStatus;
  location?: string;
  description?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkshopSchema = new Schema<IWorkshop>(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    instructor: { type: String, required: true },
    dateTime: { type: Date, required: true },
    capacity: { type: Number, required: true },
    activeCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
    location: { type: String },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Workshop: Model<IWorkshop> =
  mongoose.models.Workshop || mongoose.model<IWorkshop>("Workshop", WorkshopSchema);

export default Workshop;
