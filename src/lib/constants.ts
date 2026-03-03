export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Demo Sent",
  "Interested",
  "Won",
  "Lost",
] as const;

export const LEAD_PRIORITIES = ["Low", "Medium", "High"] as const;

export const LEAD_SOURCES = [
  "Website",
  "Referral",
  "Cold Outreach",
  "LinkedIn",
  "Event",
  "Other",
] as const;

export const ACTIVITY_TYPES = [
  "call",
  "email",
  "note",
  "status-change",
] as const;

export const AUTH_COOKIE_NAME = "crm_session";
