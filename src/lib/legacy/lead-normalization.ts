import { COMPANY_PRIORITIES, COMPANY_SOURCES, COMPANY_STATUSES } from "@/lib/constants";

const COMPANY_STATUS_SET = new Set<string>(COMPANY_STATUSES);
const COMPANY_PRIORITY_SET = new Set<string>(COMPANY_PRIORITIES);
const COMPANY_SOURCE_SET = new Set<string>(COMPANY_SOURCES);

type AnyDoc = Record<string, unknown>;

export type NormalizedLegacyCompany = {
  name: string;
  website: string;
  industry: string;
  status: (typeof COMPANY_STATUSES)[number];
  priority: (typeof COMPANY_PRIORITIES)[number];
  source: (typeof COMPANY_SOURCES)[number];
  tags: string[];
  notes: string;
  instagramHandle: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  xUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  addresses: string[];
  phones: string[];
  emails: string[];
  assignedTo: string;
  lastTouchAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LegacyMappingResult =
  | { ok: true; company: NormalizedLegacyCompany }
  | { ok: false; reason: "missing-name" };

function getString(doc: AnyDoc, keys: string[]) {
  for (const key of keys) {
    const value = doc[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  return "";
}

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeList(value: unknown): string[] {
  if (!value) return [];

  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,;|]+/)
      : [];

  return [
    ...new Set(
      raw
        .filter((item) => item !== null && item !== undefined)
        .map((item) => String(item).trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeEmails(doc: AnyDoc) {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const fromNotes = String(doc.notes || "").match(emailRegex) || [];

  return normalizeList([
    ...normalizeList(doc.emails),
    ...normalizeList(doc.altEmails),
    doc.email,
    doc.contactEmail,
    doc.primaryEmail,
    ...fromNotes,
  ]);
}

function normalizePhones(doc: AnyDoc) {
  const phoneRegex = /(?:\+?\d[\d\s().-]{6,}\d)/g;
  const fromNotes = String(doc.notes || "").match(phoneRegex) || [];

  return normalizeList([
    ...normalizeList(doc.phones),
    ...normalizeList(doc.altPhones),
    doc.phone,
    doc.contactPhone,
    doc.primaryPhone,
    ...fromNotes,
  ]);
}

function normalizeStatus(value: string) {
  if (COMPANY_STATUS_SET.has(value)) return value as (typeof COMPANY_STATUSES)[number];

  const normalized = value.toLowerCase();
  if (["qualified", "warm", "active"].includes(normalized)) return "Interested";
  if (["in-progress", "in progress", "contacting"].includes(normalized)) return "Contacted";
  if (["proposal", "proposal sent"].includes(normalized)) return "Demo Sent";
  if (["closed won", "closed-won", "won"].includes(normalized)) return "Won";
  if (["closed lost", "closed-lost", "lost", "dead"].includes(normalized)) return "Lost";
  return "New";
}

function normalizePriority(value: string) {
  if (COMPANY_PRIORITY_SET.has(value)) return value as (typeof COMPANY_PRIORITIES)[number];

  const normalized = value.toLowerCase();
  if (["urgent", "p1", "high"].includes(normalized)) return "High";
  if (["p3", "low"].includes(normalized)) return "Low";
  return "Medium";
}

function normalizeSource(value: string) {
  if (COMPANY_SOURCE_SET.has(value)) return value as (typeof COMPANY_SOURCES)[number];

  const normalized = value.toLowerCase();
  if (normalized.includes("refer")) return "Referral";
  if (normalized.includes("linkedin")) return "LinkedIn";
  if (normalized.includes("event")) return "Event";
  if (normalized.includes("cold")) return "Cold Outreach";
  if (normalized.includes("site") || normalized.includes("web")) return "Website";
  return "Other";
}

export function normalizeLegacyLead(doc: AnyDoc): LegacyMappingResult {
  const name = getString(doc, [
    "name",
    "company",
    "companyName",
    "company_name",
    "businessName",
    "business_name",
    "organization",
    "organisation",
    "accountName",
    "account_name",
  ]);

  if (!name) {
    return { ok: false, reason: "missing-name" };
  }

  const now = new Date();
  const createdAt = normalizeDate(doc.createdAt) || now;
  const updatedAt = normalizeDate(doc.updatedAt) || createdAt;

  return {
    ok: true,
    company: {
      name,
      website: getString(doc, ["website", "url", "domain"]),
      industry: getString(doc, ["industry", "vertical", "sector"]),
      status: normalizeStatus(getString(doc, ["status", "leadStatus", "stage"])),
      priority: normalizePriority(getString(doc, ["priority", "leadPriority", "importance"])),
      source: normalizeSource(getString(doc, ["source", "leadSource", "channel"])),
      tags: normalizeList(doc.tags),
      notes: getString(doc, ["notes", "description", "context"]),
      instagramHandle: getString(doc, ["instagramHandle", "instagram_handle"]),
      instagramUrl: getString(doc, ["instagramUrl", "instagram_url"]),
      facebookUrl: getString(doc, ["facebookUrl", "facebook_url"]),
      linkedinUrl: getString(doc, ["linkedinUrl", "linkedin_url"]),
      xUrl: getString(doc, ["xUrl", "x_url", "twitterUrl", "twitter_url"]),
      tiktokUrl: getString(doc, ["tiktokUrl", "tiktok_url"]),
      youtubeUrl: getString(doc, ["youtubeUrl", "youtube_url"]),
      addresses: normalizeList(doc.addresses),
      phones: normalizePhones(doc),
      emails: normalizeEmails(doc),
      assignedTo: getString(doc, ["assignedTo", "owner", "assignee"]),
      lastTouchAt: normalizeDate(doc.lastTouchAt || doc.lastContactAt),
      nextFollowUpAt: normalizeDate(doc.nextFollowUpAt || doc.followUpAt || doc.next_follow_up),
      createdAt,
      updatedAt,
    },
  };
}
