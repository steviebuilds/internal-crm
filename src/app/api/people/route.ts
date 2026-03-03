import { isAuthenticatedFromCookies } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { badRequest, ok, serialize, unauthorized } from "@/lib/http";
import { PersonModel } from "@/lib/models/Person";
import { listPeople } from "@/lib/services/people";
import { personInputSchema } from "@/lib/validation";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export async function GET(req: Request) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const companyId = searchParams.get("companyId") || undefined;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 50);

  const { people, pagination } = await listPeople({ q, companyId, page, pageSize });

  return ok(serialize({ people, ...pagination }));
}

export async function POST(req: Request) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  try {
    const parsed = personInputSchema.parse(await req.json());
    await connectDb();

    if (parsed.isPrimaryContact) {
      await PersonModel.updateMany(
        { companyId: parsed.companyId, isPrimaryContact: true },
        { $set: { isPrimaryContact: false } },
      );
    }

    const person = await PersonModel.create(parsed);
    return ok(serialize(person), { status: 201 });
  } catch (error) {
    return badRequest("Invalid person payload", error);
  }
}
