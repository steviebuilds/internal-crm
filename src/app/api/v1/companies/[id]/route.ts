import { NextRequest } from "next/server";
import { addStatusChangeActivity } from "@/lib/services/companies";
import { badRequest, notFound, ok, serialize } from "@/lib/http";
import { connectDb } from "@/lib/db";
import { requireExternalApiKey } from "@/lib/external-api";
import { ActivityModel } from "@/lib/models/Activity";
import { CompanyModel } from "@/lib/models/Company";
import { PersonModel } from "@/lib/models/Person";
import { companyPatchSchema } from "@/lib/validation";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  await connectDb();
  const { id } = await ctx.params;
  const company = await CompanyModel.findById(id).lean();
  if (!company) return notFound();
  return ok(serialize(company));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const patch = companyPatchSchema.parse(await req.json());

    await connectDb();
    const existing = await CompanyModel.findById(id);
    if (!existing) return notFound();

    const previousStatus = existing.status;
    Object.assign(existing, patch);
    await existing.save();

    if (patch.status && patch.status !== previousStatus) {
      await addStatusChangeActivity(id, previousStatus, patch.status);
    }

    return ok(serialize(existing));
  } catch (error) {
    return badRequest("Invalid company patch payload", error);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  await connectDb();
  const { id } = await ctx.params;

  const deleted = await CompanyModel.findByIdAndDelete(id);
  if (!deleted) return notFound();

  await Promise.all([
    PersonModel.deleteMany({ companyId: id }),
    ActivityModel.deleteMany({ companyId: id }),
  ]);

  return ok({ success: true });
}
