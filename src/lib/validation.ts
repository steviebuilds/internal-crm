import { z } from "zod";
import {
  ACTIVITY_TYPES,
  COMPANY_PRIORITIES,
  COMPANY_SOURCES,
  COMPANY_STATUSES,
} from "@/lib/constants";

const optionalDate = z
  .string()
  .datetime()
  .optional()
  .nullable()
  .transform((val) => (val ? new Date(val) : null));

const optionalUrl = z.union([z.literal(""), z.string().url().max(300)]).default("");

const csvStringArray = (max = 120) => z.array(z.string().min(1).max(max)).default([]);

export const companyInputSchema = z.object({
  name: z.string().min(1).max(120),
  website: optionalUrl,
  industry: z.string().max(120).optional().default(""),
  source: z.enum(COMPANY_SOURCES),
  status: z.enum(COMPANY_STATUSES),
  priority: z.enum(COMPANY_PRIORITIES),
  tags: z.array(z.string().min(1).max(30)).default([]),
  notes: z.string().max(5000).optional().default(""),
  instagramHandle: z.string().max(80).optional().default(""),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  xUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  addresses: csvStringArray(200),
  phones: csvStringArray(40),
  emails: z.array(z.string().email().max(120)).default([]),
  assignedTo: z.string().max(120).optional().default(""),
  lastTouchAt: optionalDate,
  nextFollowUpAt: optionalDate,
});

export const companyPatchSchema = companyInputSchema.partial();

export const personInputSchema = z.object({
  companyId: z.string().min(1),
  fullName: z.string().min(1).max(120),
  role: z.string().max(120).optional().default(""),
  phones: csvStringArray(40),
  emails: z.array(z.string().email().max(120)).default([]),
  linkedinUrl: optionalUrl,
  instagramHandle: z.string().max(80).optional().default(""),
  instagramUrl: optionalUrl,
  confidenceScore: z.number().min(0).max(1).optional().default(1),
  confidenceSource: z.string().max(80).optional().default("manual"),
  confidenceNotes: z.string().max(500).optional().default(""),
  notes: z.string().max(5000).optional().default(""),
  isPrimaryContact: z.boolean().optional().default(false),
});

export const personPatchSchema = personInputSchema.partial();

export const activityInputSchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  body: z.string().min(1).max(1500),
});

export const followUpActionSchema = z.object({
  companyId: z.string().min(1),
  action: z.enum(["done", "snooze", "reschedule"]),
  until: optionalDate,
});
