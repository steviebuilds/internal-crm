import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { requireExternalApiKey } from "@/lib/external-api";
import { badRequest, ok, serialize, notFound } from "@/lib/http";
import { CompanyModel } from "@/lib/models/Company";
import { PersonModel } from "@/lib/models/Person";
import { listPeople } from "@/lib/services/people";
import { personInputSchema } from "@/lib/validation";
import { parsePositiveInt } from "@/lib/pagination";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 50);

  const { people, pagination } = await listPeople({ companyId: id, q, page, pageSize });

  return ok(serialize({ people, ...pagination }));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

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
