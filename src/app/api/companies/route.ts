import { isAuthenticatedFromCookies } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import { badRequest, ok, serialize, unauthorized } from "@/lib/http";
import { CompanyModel } from "@/lib/models/Company";
import { companyInputSchema } from "@/lib/validation";
import { getFollowUpBuckets, getPipelineCounts, listCompanies } from "@/lib/services/companies";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export async function GET(req: Request) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

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
      return ok(
        serialize({
          companies,
          ...pagination,
        }),
      );
    }

    const [pipeline, followUps] = await Promise.all([
      getPipelineCounts(),
      getFollowUpBuckets(),
    ]);

    return ok(
      serialize({
        companies,
        pipeline,
        followUps,
        ...pagination,
      }),
    );
  } catch (error) {
    const details = getErrorMessage(error);
    return ok({
      companies: [],
      pipeline: [],
      followUps: { overdue: [], dueToday: [] },
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
      warning: "Mongo unavailable, serving empty CRM dataset.",
      details,
    });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  try {
    const parsed = companyInputSchema.parse(await req.json());
    await connectDb();
    const company = await CompanyModel.create(parsed);
    return ok(serialize(company), { status: 201 });
  } catch (error) {
    return badRequest("Invalid company payload", error);
  }
}
