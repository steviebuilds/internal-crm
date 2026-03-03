import { connectDb } from "@/lib/db";
import { PersonModel } from "@/lib/models/Person";

type PeopleFilters = {
  q?: string;
  companyId?: string;
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

function buildQuery(filters: PeopleFilters) {
  const query: Record<string, unknown> = {};

  if (filters.companyId) query.companyId = filters.companyId;
  if (filters.q?.trim()) query.$text = { $search: filters.q.trim() };

  return query;
}

export async function listPeople(filters: PeopleFilters) {
  await connectDb();

  const query = buildQuery(filters);
  const { page, pageSize } = getSafePagination(filters.page, filters.pageSize);
  const skip = (page - 1) * pageSize;

  const total = await PersonModel.countDocuments(query);

  const findQuery = PersonModel.find(query).skip(skip).limit(pageSize).lean();

  if (query.$text) {
    findQuery.sort({ score: { $meta: "textScore" }, updatedAt: -1, _id: -1 });
    findQuery.select({ score: { $meta: "textScore" } });
  } else {
    findQuery.sort({ isPrimaryContact: -1, updatedAt: -1, _id: -1 });
  }

  const people = await findQuery;

  return {
    people,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}
