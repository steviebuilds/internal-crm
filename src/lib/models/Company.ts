import { InferSchemaType, Model, Schema, model, models } from "mongoose";
import { COMPANY_PRIORITIES, COMPANY_SOURCES, COMPANY_STATUSES } from "@/lib/constants";

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    website: { type: String, trim: true, maxlength: 300, default: "" },
    industry: { type: String, trim: true, maxlength: 120, default: "" },
    status: { type: String, enum: COMPANY_STATUSES, required: true, default: "New" },
    priority: { type: String, enum: COMPANY_PRIORITIES, required: true, default: "Medium" },
    source: { type: String, enum: COMPANY_SOURCES, required: true },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "" },
    instagramHandle: { type: String, trim: true, maxlength: 80, default: "" },
    instagramUrl: { type: String, trim: true, maxlength: 300, default: "" },
    facebookUrl: { type: String, trim: true, maxlength: 300, default: "" },
    linkedinUrl: { type: String, trim: true, maxlength: 300, default: "" },
    xUrl: { type: String, trim: true, maxlength: 300, default: "" },
    tiktokUrl: { type: String, trim: true, maxlength: 300, default: "" },
    youtubeUrl: { type: String, trim: true, maxlength: 300, default: "" },
    addresses: { type: [String], default: [] },
    phones: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    assignedTo: { type: String, trim: true, maxlength: 120, default: "" },
    lastTouchAt: { type: Date, default: null },
    nextFollowUpAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

companySchema.index({
  name: "text",
  industry: "text",
  website: "text",
  notes: "text",
  instagramHandle: "text",
  emails: "text",
  phones: "text",
  assignedTo: "text",
});

companySchema.index({ updatedAt: -1 });
companySchema.index({ status: 1, updatedAt: -1 });
companySchema.index({ priority: 1, updatedAt: -1 });
companySchema.index({ status: 1, priority: 1, updatedAt: -1 });
companySchema.index({ nextFollowUpAt: 1, updatedAt: -1 });

export type Company = InferSchemaType<typeof companySchema> & { _id: string };

export const CompanyModel: Model<Company> =
  (models.Company as Model<Company>) || model<Company>("Company", companySchema, "companies");
