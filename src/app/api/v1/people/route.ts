import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { requireExternalApiKey } from "@/lib/external-api";
import { badRequest, ok, serialize } from "@/lib/http";
import { PersonModel } from "@/lib/models/Person";
import { listPeople } from "@/lib/services/people";
import { personInputSchema } from "@/lib/validation";
import { parsePositiveInt } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const companyId = searchParams.get("companyId") || undefined;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 50);

  const { people, pagination } = await listPeople({ q, companyId, page, pageSize });

  return ok(serialize({ people, ...pagination }));
}

export async function POST(req: NextRequest) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

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
