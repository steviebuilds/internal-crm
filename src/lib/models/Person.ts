import { InferSchemaType, Model, Schema, model, models, Types } from "mongoose";

const personSchema = new Schema(
  {
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, trim: true, maxlength: 120, default: "" },
    phones: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    linkedinUrl: { type: String, trim: true, maxlength: 300, default: "" },
    instagramHandle: { type: String, trim: true, maxlength: 80, default: "" },
    instagramUrl: { type: String, trim: true, maxlength: 300, default: "" },
    confidenceScore: { type: Number, min: 0, max: 1, default: 1 },
    confidenceSource: { type: String, trim: true, maxlength: 80, default: "manual" },
    confidenceNotes: { type: String, trim: true, maxlength: 500, default: "" },
    notes: { type: String, default: "" },
    isPrimaryContact: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

personSchema.index({
  fullName: "text",
  role: "text",
  emails: "text",
  phones: "text",
  notes: "text",
  linkedinUrl: "text",
  instagramHandle: "text",
});
personSchema.index({ companyId: 1, isPrimaryContact: -1, updatedAt: -1 });
personSchema.index({ updatedAt: -1 });

export type Person = InferSchemaType<typeof personSchema> & { _id: string };

export const PersonModel: Model<Person> =
  (models.Person as Model<Person>) || model<Person>("Person", personSchema, "people");
