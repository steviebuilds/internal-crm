import { InferSchemaType, Model, Schema, model, models } from "mongoose";
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";

const leadSchema = new Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 120 },
    contactName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    source: { type: String, enum: LEAD_SOURCES, required: true },
    status: { type: String, enum: LEAD_STATUSES, required: true, default: "New" },
    priority: { type: String, enum: LEAD_PRIORITIES, required: true, default: "Medium" },
    value: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },
    lastTouchAt: { type: Date, default: null },
    nextFollowUpAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
  },
);

leadSchema.index({ company: "text", contactName: "text", email: "text" });

export type Lead = InferSchemaType<typeof leadSchema> & { _id: string };

export const LeadModel: Model<Lead> =
  (models.Lead as Model<Lead>) || model<Lead>("Lead", leadSchema);
