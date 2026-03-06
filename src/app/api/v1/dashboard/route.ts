import { NextRequest } from "next/server";
import { requireExternalApiKey } from "@/lib/external-api";
import { ok, serialize } from "@/lib/http";
import { getFollowUpBuckets, getPipelineCounts, listCompanies } from "@/lib/services/companies";

export async function GET(req: NextRequest) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  const [{ pagination }, pipeline, followUps] = await Promise.all([
    listCompanies({ page: 1, pageSize: 1 }),
    getPipelineCounts(),
    getFollowUpBuckets(),
  ]);

  return ok(
    serialize({
      totalCompanies: pagination.total,
      pipeline,
      followUps,
    }),
  );
}
