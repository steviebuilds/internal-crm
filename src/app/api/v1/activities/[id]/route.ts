import { NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { requireExternalApiKey } from "@/lib/external-api";
import { badRequest, notFound, ok, serialize } from "@/lib/http";
import { ActivityModel } from "@/lib/models/Activity";
import { activityPatchSchema } from "@/lib/validation";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  await connectDb();
  const { id } = await ctx.params;
  const activity = await ActivityModel.findById(id).lean();
  if (!activity) return notFound();
  return ok(serialize(activity));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  try {
    const { id } = await ctx.params;
    const patch = activityPatchSchema.parse(await req.json());

    await connectDb();
    const existing = await ActivityModel.findById(id);
    if (!existing) return notFound();

    Object.assign(existing, patch);
    await existing.save();

    return ok(serialize(existing));
  } catch (error) {
    return badRequest("Invalid activity patch payload", error);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const authError = requireExternalApiKey(req);
  if (authError) return authError;

  await connectDb();
  const { id } = await ctx.params;
  const deleted = await ActivityModel.findByIdAndDelete(id);
  if (!deleted) return notFound();
  return ok({ success: true });
}
