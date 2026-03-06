import { unauthorized } from "@/lib/http";

export const DEFAULT_EXTERNAL_API_KEY = "wahlu-crm-internal-2026";
export const DEFAULT_EXTERNAL_API_BASE_URL = "https://crm.stevie.cool";

function safeEquals(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function getExternalApiKey() {
  return process.env.CRM_EXTERNAL_API_KEY || DEFAULT_EXTERNAL_API_KEY;
}

export function getExternalApiBaseUrl() {
  return process.env.CRM_API_BASE_URL || DEFAULT_EXTERNAL_API_BASE_URL;
}

export function extractApiKeyFromHeaders(headers: Headers) {
  const bearer = headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim();
  }

  return headers.get("x-api-key")?.trim() || "";
}

export function isValidExternalApiKey(input: string) {
  const expected = getExternalApiKey();
  if (!input) return false;
  return safeEquals(input, expected);
}

export function requireExternalApiKey(req: { headers: Headers }) {
  const apiKey = extractApiKeyFromHeaders(req.headers);
  if (isValidExternalApiKey(apiKey)) return null;
  return unauthorized();
}

export function getExternalAuthHeaders(apiKey = getExternalApiKey()) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
  };
}
