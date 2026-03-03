import { addDays, addHours } from "date-fns";
import { isAuthenticatedFromCookies } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { badRequest, ok, unauthorized, serialize, notFound } from "@/lib/http";
import { CompanyModel } from "@/lib/models/Company";
import { getFollowUpBuckets } from "@/lib/services/companies";
import { followUpActionSchema } from "@/lib/validation";

export async function GET() {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();
  const data = await getFollowUpBuckets();
  return ok(serialize(data));
}

export async function POST(req: Request) {
  if (!(await isAuthenticatedFromCookies())) return unauthorized();

  try {
    const payload = followUpActionSchema.parse(await req.json());
    await connectDb();

    const company = await CompanyModel.findById(payload.companyId);
    if (!company) return notFound();

    if (payload.action === "done") {
      company.lastTouchAt = new Date();
      company.nextFollowUpAt = null;
    }

    if (payload.action === "snooze") {
      company.nextFollowUpAt = addHours(new Date(), 24);
    }

    if (payload.action === "reschedule") {
      company.nextFollowUpAt = payload.until || addDays(new Date(), 2);
    }

    await company.save();
    return ok(serialize(company));
  } catch (error) {
    return badRequest("Invalid follow-up action", error);
  }
}
