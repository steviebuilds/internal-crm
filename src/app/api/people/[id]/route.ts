import { isAuthenticatedFromCookies } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { badRequest, notFound, ok, serialize, unauthorized } from "@/lib/http";
import { PersonModel } from "@/lib/models/Person";
import { personPatchSchema } from "@/lib/validation";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  await connectDb();
  const { id } = await ctx.params;
  const person = await PersonModel.findById(id).lean();
  if (!person) return notFound();
  return ok(serialize(person));
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

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

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  await connectDb();
  const { id } = await ctx.params;

  const deleted = await PersonModel.findByIdAndDelete(id);
  if (!deleted) return notFound();

  return ok({ success: true });
}
