import { addHours, addDays } from "date-fns";
import { isAuthenticatedFromCookies } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { badRequest, ok, unauthorized, serialize, notFound } from "@/lib/http";
import { LeadModel } from "@/lib/models/Lead";
import { getFollowUpBuckets } from "@/lib/services/leads";
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

    const lead = await LeadModel.findById(payload.leadId);
    if (!lead) return notFound();

    if (payload.action === "done") {
      lead.lastTouchAt = new Date();
      lead.nextFollowUpAt = null;
    }

    if (payload.action === "snooze") {
      lead.nextFollowUpAt = addHours(new Date(), 24);
    }

    if (payload.action === "reschedule") {
      lead.nextFollowUpAt = payload.until || addDays(new Date(), 2);
    }

    await lead.save();
    return ok(serialize(lead));
  } catch (error) {
    return badRequest("Invalid follow-up action", error);
  }
}
