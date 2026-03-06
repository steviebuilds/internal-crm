import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { requireExternalApiKey } from "@/lib/external-api";
import { badRequest, notFound, ok, serialize } from "@/lib/http";
import { PersonModel } from "@/lib/models/Person";
import { personPatchSchema } from "@/lib/validation";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  await connectDb();
  const { id } = await ctx.params;
  const person = await PersonModel.findById(id).lean();
  if (!person) return notFound();
  return ok(serialize(person));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const patch = personPatchSchema.parse(await req.json());

    await connectDb();
    const existing = await PersonModel.findById(id);
    if (!existing) return notFound();

    const targetCompanyId = patch.companyId || String(existing.companyId);

    if (patch.isPrimaryContact) {
      await PersonModel.updateMany(
        { companyId: targetCompanyId, isPrimaryContact: true, _id: { $ne: id } },
        { $set: { isPrimaryContact: false } },
      );
    }

    Object.assign(existing, patch);
    await existing.save();

    return ok(serialize(existing));
  } catch (error) {
    return badRequest("Invalid person patch payload", error);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  await connectDb();
  const { id } = await ctx.params;

  const deleted = await PersonModel.findByIdAndDelete(id);
  if (!deleted) return notFound();

  return ok({ success: true });
}
