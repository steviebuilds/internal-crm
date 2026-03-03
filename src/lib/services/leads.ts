import { startOfDay, endOfDay } from "date-fns";
import { connectDb } from "@/lib/db";
import { ActivityModel } from "@/lib/models/Activity";
import { LeadModel } from "@/lib/models/Lead";
import { LEAD_STATUSES } from "@/lib/constants";

type LeadFilters = {
  q?: string;
  status?: string;
  priority?: string;
};

export async function listLeads(filters: LeadFilters) {
  await connectDb();

  const query: Record<string, unknown> = {};

  if (filters.q) {
    query.$or = [
      { company: { $regex: filters.q, $options: "i" } },
      { contactName: { $regex: filters.q, $options: "i" } },
    ];
  }

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;

  return LeadModel.find(query).sort({ updatedAt: -1 }).lean();
}

export async function getPipelineCounts() {
  await connectDb();
  const grouped = await LeadModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return LEAD_STATUSES.map((status) => ({
    status,
    count: grouped.find((g) => g._id === status)?.count ?? 0,
  }));
}

export async function listLeadActivities(leadId: string) {
  await connectDb();
  return ActivityModel.find({ leadId }).sort({ createdAt: -1 }).lean();
}

export async function addStatusChangeActivity(
  leadId: string,
  previous: string,
  next: string,
) {
  await connectDb();
  await ActivityModel.create({
    leadId,
    type: "status-change",
    body: `Status changed from ${previous} to ${next}`,
  });
}

export async function getFollowUpBuckets() {
  await connectDb();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [overdue, dueToday] = await Promise.all([
    LeadModel.find({
      nextFollowUpAt: { $lt: todayStart, $ne: null },
    })
      .sort({ nextFollowUpAt: 1 })
      .lean(),
    LeadModel.find({
      nextFollowUpAt: { $gte: todayStart, $lte: todayEnd },
    })
      .sort({ nextFollowUpAt: 1 })
      .lean(),
  ]);

  return { overdue, dueToday };
}
