const INVALID_COMPANY_NAME_TOKENS = new Set([
  "-",
  "—",
  "n/a",
  "na",
  "unknown",
  "null",
  "undefined",
  "none",
]);

const COMPANY_NAME_KEYS = ["name", "companyName", "company", "businessName", "business_name"] as const;

type AnyRecord = Record<string, unknown>;

export function normalizeCompanyDisplayName(raw: unknown) {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return INVALID_COMPANY_NAME_TOKENS.has(trimmed.toLowerCase()) ? "" : trimmed;
}

export function getCanonicalCompanyName(company: AnyRecord) {
  for (const key of COMPANY_NAME_KEYS) {
    const normalized = normalizeCompanyDisplayName(company[key]);
    if (normalized) return normalized;
  }
  return "";
}

export function hasCanonicalCompanyName(company: AnyRecord) {
  return Boolean(getCanonicalCompanyName(company));
}
