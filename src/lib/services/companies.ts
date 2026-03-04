import mongoose from "mongoose";
import { endOfDay, startOfDay } from "date-fns";
import { connectDb } from "@/lib/db";
import { COMPANY_STATUSES } from "@/lib/constants";
import { normalizeLegacyLead, type NormalizedLegacyCompany } from "@/lib/legacy/lead-normalization";
import { ActivityModel } from "@/lib/models/Activity";
import { CompanyModel } from "@/lib/models/Company";
import { PersonModel } from "@/lib/models/Person";

type CompanyFilters = {
  q?: string;
  status?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
};

function getSafePagination(page?: number, pageSize?: number) {
  const safePage = Number.isFinite(page) && (page as number) > 0 ? Math.floor(page as number) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && (pageSize as number) > 0
      ? Math.min(200, Math.floor(pageSize as number))
      : 50;

  return { page: safePage, pageSize: safePageSize };
}

function buildCompanyQuery(filters: CompanyFilters) {
  const query: Record<string, unknown> = {};

  if (filters.q?.trim()) {
    query.$text = { $search: filters.q.trim() };
  }

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;

  return query;
}

function isLegacyFallbackEnabled() {
  return process.env.ENABLE_LEGACY_LEADS_FALLBACK === "1";
}

function applyInMemoryFilters(
  company: NormalizedLegacyCompany,
  filters: CompanyFilters,
) {
  if (filters.status && company.status !== filters.status) return false;
  if (filters.priority && company.priority !== filters.priority) return false;

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    const haystack = [
      company.name,
      company.industry,
      company.website,
      company.notes,
      ...company.emails,
      ...company.phones,
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(q)) return false;
  }

  return true;
}

async function listFromLegacyLeads(filters: CompanyFilters) {
  const db = mongoose.connection.db;
  if (!db) return { companies: [], total: 0, skippedMissingName: 0 };

  const collections = (await db.listCollections({ name: "leads" }).toArray()).map((c) => c.name);
  if (!collections.includes("leads")) {
    return { companies: [], total: 0, skippedMissingName: 0 };
  }

  const leads = db.collection("leads");
  const rawDocs = await leads.find({}, { sort: { updatedAt: -1, _id: -1 } }).toArray();

  const mapped: Record<string, unknown>[] = [];
  let skippedMissingName = 0;

  for (const doc of rawDocs) {
    const normalized = normalizeLegacyLead(doc as Record<string, unknown>);
    if (!normalized.ok) {
      if (normalized.reason === "missing-name") skippedMissingName += 1;
      continue;
    }

    if (!applyInMemoryFilters(normalized.company, filters)) {
      continue;
    }

    mapped.push({
      _id: doc._id,
      ...normalized.company,
    });
  }

  const { page, pageSize } = getSafePagination(filters.page, filters.pageSize);
  const skip = (page - 1) * pageSize;

  const companies = mapped.slice(skip, skip + pageSize);

  return { companies, total: mapped.length, skippedMissingName };
}

export async function listCompanies(filters: CompanyFilters) {
  await connectDb();

  const query = buildCompanyQuery(filters);
  const { page, pageSize } = getSafePagination(filters.page, filters.pageSize);
  const skip = (page - 1) * pageSize;

  let total = await CompanyModel.countDocuments(query);

  let companies = await (async () => {
    const findQuery = CompanyModel.find(query).skip(skip).limit(pageSize).lean();

    if (query.$text) {
      findQuery.sort({ score: { $meta: "textScore" }, updatedAt: -1, _id: -1 });
      findQuery.select({ score: { $meta: "textScore" } });
    } else {
      findQuery.sort({ updatedAt: -1, _id: -1 });
    }

    return findQuery;
  })();

  // Legacy fallback is opt-in only to avoid serving schema-mismatched leads as companies.
  if (total === 0 && isLegacyFallbackEnabled()) {
    const legacy = await listFromLegacyLeads(filters);
    if (legacy.total > 0) {
      companies = legacy.companies as unknown as typeof companies;
      total = legacy.total;
    }

    if (legacy.skippedMissingName > 0) {
      console.warn(
        `[companies] skipped ${legacy.skippedMissingName} legacy lead rows missing canonical company name`,
      );
    }
  }

  const companyIds = companies.map((c) => c._id);
  const primaryContacts = await PersonModel.find({
    companyId: { $in: companyIds },
    isPrimaryContact: true,
  })
    .select({ companyId: 1, fullName: 1, emails: 1, phones: 1 })
    .lean();

  const primaryByCompany = new Map(
    primaryContacts.map((p) => [String(p.companyId), p]),
  );

  const enriched = companies.map((company) => ({
    ...company,
    primaryContact: primaryByCompany.get(String(company._id)) || null,
  }));

  return {
    companies: enriched,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getPipelineCounts() {
  await connectDb();
  const grouped = await CompanyModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return COMPANY_STATUSES.map((status) => ({
    status,
    count: grouped.find((g) => g._id === status)?.count ?? 0,
  }));
}

export async function listCompanyActivities(companyId: string) {
  await connectDb();
  return ActivityModel.find({ companyId }).sort({ createdAt: -1 }).lean();
}

export async function addStatusChangeActivity(
  companyId: string,
  previous: string,
  next: string,
) {
  await connectDb();
  await ActivityModel.create({
    companyId,
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
    CompanyModel.find({
      nextFollowUpAt: { $lt: todayStart, $ne: null },
    })
      .sort({ nextFollowUpAt: 1 })
      .limit(50)
      .lean(),
    CompanyModel.find({
      nextFollowUpAt: { $gte: todayStart, $lte: todayEnd },
    })
      .sort({ nextFollowUpAt: 1 })
      .limit(50)
      .lean(),
  ]);

  return { overdue, dueToday };
}
