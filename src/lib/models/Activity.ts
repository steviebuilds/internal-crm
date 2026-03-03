import { InferSchemaType, Model, Schema, model, models } from "mongoose";
import { ACTIVITY_TYPES } from "@/lib/constants";

const activitySchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    body: { type: String, required: true, maxlength: 1500 },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({ leadId: 1, createdAt: -1 });

export type Activity = InferSchemaType<typeof activitySchema> & { _id: string };

export const ActivityModel: Model<Activity> =
  (models.Activity as Model<Activity>) || model<Activity>("Activity", activitySchema);
