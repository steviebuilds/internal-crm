import { isAuthenticatedFromCookies } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { badRequest, ok, serialize, unauthorized, notFound } from "@/lib/http";
import { CompanyModel } from "@/lib/models/Company";
import { PersonModel } from "@/lib/models/Person";
import { listPeople } from "@/lib/services/people";
import { personInputSchema } from "@/lib/validation";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 50);

  const { people, pagination } = await listPeople({ companyId: id, q, page, pageSize });

  return ok(serialize({ people, ...pagination }));
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  try {
    const { id } = await ctx.params;
    await connectDb();

    const company = await CompanyModel.findById(id).lean();
    if (!company) return notFound();

    const parsed = personInputSchema.parse({ ...(await req.json()), companyId: id });

    if (parsed.isPrimaryContact) {
      await PersonModel.updateMany({ companyId: id, isPrimaryContact: true }, { $set: { isPrimaryContact: false } });
    }

    const person = await PersonModel.create(parsed);
    return ok(serialize(person), { status: 201 });
  } catch (error) {
    return badRequest("Invalid company person payload", error);
  }
}
