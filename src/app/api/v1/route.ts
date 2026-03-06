import { NextRequest } from "next/server";
import { requireExternalApiKey } from "@/lib/external-api";
import { ok } from "@/lib/http";

export async function GET(req: NextRequest) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  return ok({
    name: "Wahlu CRM External API",
    version: "v1",
    auth: {
      type: "api-key",
      headers: ["Authorization: Bearer <key>", "x-api-key: <key>"],
    },
    endpoints: [
      "GET /api/v1",
      "GET /api/v1/health",
      "GET /api/v1/dashboard",
      "GET /api/v1/companies",
      "POST /api/v1/companies",
      "GET /api/v1/companies/:id",
      "PATCH /api/v1/companies/:id",
      "DELETE /api/v1/companies/:id",
      "GET /api/v1/companies/:id/activities",
      "POST /api/v1/companies/:id/activities",
      "GET /api/v1/companies/:id/people",
      "POST /api/v1/companies/:id/people",
      "GET /api/v1/activities/:id",
      "PATCH /api/v1/activities/:id",
      "DELETE /api/v1/activities/:id",
      "GET /api/v1/people",
      "POST /api/v1/people",
      "GET /api/v1/people/:id",
      "PATCH /api/v1/people/:id",
      "DELETE /api/v1/people/:id",
    ],
  });
}
