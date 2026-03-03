export const COMPANY_STATUSES = [
  "New",
  "Contacted",
  "Demo Sent",
  "Interested",
  "Won",
  "Lost",
] as const;

export const COMPANY_PRIORITIES = ["Low", "Medium", "High"] as const;

export const COMPANY_SOURCES = [
  "Website",
  "Referral",
  "Cold Outreach",
  "LinkedIn",
  "Event",
  "Other",
] as const;

export const ACTIVITY_TYPES = ["call", "email", "note", "status-change"] as const;

export const AUTH_COOKIE_NAME = "crm_session";
