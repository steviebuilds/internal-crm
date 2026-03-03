import { isAuthenticatedFromCookies } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { badRequest, ok, unauthorized, serialize, notFound } from "@/lib/http";
import { ActivityModel } from "@/lib/models/Activity";
import { CompanyModel } from "@/lib/models/Company";
import { activityInputSchema } from "@/lib/validation";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  await connectDb();
  const { id } = await ctx.params;
  const activities = await ActivityModel.find({ companyId: id })
    .sort({ createdAt: -1 })
    .lean();

  return ok(serialize(activities));
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  try {
    const { id } = await ctx.params;
    const payload = activityInputSchema.parse(await req.json());
    await connectDb();

    const company = await CompanyModel.findById(id);
    if (!company) return notFound();

    const activity = await ActivityModel.create({
      companyId: id,
      ...payload,
    });

    company.lastTouchAt = new Date();
    await company.save();

    return ok(serialize(activity), { status: 201 });
  } catch (error) {
    return badRequest("Invalid activity payload", error);
  }
}
