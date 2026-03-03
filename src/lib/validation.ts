import { z } from "zod";
import {
  ACTIVITY_TYPES,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/constants";

const optionalDate = z
  .string()
  .datetime()
  .optional()
  .nullable()
  .transform((val) => (val ? new Date(val) : null));

export const leadInputSchema = z.object({
  company: z.string().min(1).max(120),
  contactName: z.string().min(1).max(120),
  email: z.string().email().max(120),
  phone: z.string().max(40).optional().default(""),
  source: z.enum(LEAD_SOURCES),
  status: z.enum(LEAD_STATUSES),
  priority: z.enum(LEAD_PRIORITIES),
  value: z.number().min(0).default(0),
  notes: z.string().max(5000).optional().default(""),
  tags: z.array(z.string().min(1).max(30)).default([]),
  lastTouchAt: optionalDate,
  nextFollowUpAt: optionalDate,
});

export const leadPatchSchema = leadInputSchema.partial();

export const activityInputSchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  body: z.string().min(1).max(1500),
});

export const followUpActionSchema = z.object({
  leadId: z.string().min(1),
  action: z.enum(["done", "snooze", "reschedule"]),
  until: optionalDate,
});
