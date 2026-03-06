import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { requireExternalApiKey } from "@/lib/external-api";
import { badRequest, ok, serialize } from "@/lib/http";
import { CompanyModel } from "@/lib/models/Company";
import { getFollowUpBuckets, getPipelineCounts, listCompanies } from "@/lib/services/companies";
import { companyInputSchema } from "@/lib/validation";
import { parsePositiveInt } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const withMeta = searchParams.get("withMeta") === "1";
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 50);

    const { companies, pagination } = await listCompanies({ q, status, priority, page, pageSize });

    if (!withMeta) {
      return ok(serialize({ companies, ...pagination }));
    }

    const [pipeline, followUps] = await Promise.all([getPipelineCounts(), getFollowUpBuckets()]);

    return ok(
      serialize({
        companies,
        pipeline,
        followUps,
        ...pagination,
      }),
    );
  } catch (error) {
    return badRequest("Failed to load companies", error);
  }
}

export async function POST(req: NextRequest) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  try {
    const parsed = companyInputSchema.parse(await req.json());
    await connectDb();
    const company = await CompanyModel.create(parsed);
    return ok(serialize(company), { status: 201 });
  } catch (error) {
    return badRequest("Invalid company payload", error);
  }
}
