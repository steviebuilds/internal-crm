import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { requireExternalApiKey } from "@/lib/external-api";
import { ok } from "@/lib/http";

export async function GET(req: NextRequest) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  await connectDb();
  return ok({ ok: true, service: "crm", version: "v1" });
}
