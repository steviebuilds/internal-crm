"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe,
  Instagram,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { CompanyEditorModal } from "@/components/company-workspace/CompanyEditorModal";
import { CompanyForm, EMPTY_COMPANY_FORM, parseCsv } from "@/components/company-workspace/form-utils";
import { COMPANY_PRIORITIES, COMPANY_STATUSES } from "@/lib/constants";
import { Company, CompanyPriority } from "@/lib/types";

type CompanyRow = Company & {
  primaryContact?: { fullName?: string; emails?: string[]; phones?: string[] } | null;
};

type MetaPayload = {
  companies: CompanyRow[];
  pipeline: { status: string; count: number }[];
  followUps: {
    overdue: Company[];
    dueToday: Company[];
  };
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type DashboardQuery = {
  q: string;
  status: string;
  priority: string;
  page: number;
  pageSize: number;
};

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString();
}

function ensureUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function instagramHref(company: CompanyRow) {
  if (company.instagramUrl) return ensureUrl(company.instagramUrl);
  if (company.instagramHandle) return `https://instagram.com/${company.instagramHandle.replace(/^@/, "")}`;
  return "";
}

function instagramLabel(company: CompanyRow) {
  if (company.instagramHandle) return company.instagramHandle.startsWith("@") ? company.instagramHandle : `@${company.instagramHandle}`;
  return "Instagram";
}

function websiteLabel(website?: string | null) {
  if (!website) return "Website";
  return website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

export default function HomePage() {
  const requestIdRef = useRef(0);
  const [companies, setCompanies] = useState<MetaPayload["companies"]>([]);
  const [pipeline, setPipeline] = useState<{ status: string; count: number }[]>([]);
  const [followUps, setFollowUps] = useState<{ overdue: Company[]; dueToday: Company[] }>({ overdue: [], dueToday: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState<CompanyForm>(EMPTY_COMPANY_FORM);

  const loadDashboard = useCallback(async ({ q, status, priority, page, pageSize }: DashboardQuery) => {
    const requestId = ++requestIdRef.current;

    const params = new URLSearchParams({ withMeta: "1" });
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);

    try {
      const res = await fetch(`/api/companies?${params.toString()}`);
      const body = (await res.json().catch(() => ({}))) as Partial<MetaPayload> & { error?: string; details?: string };

      if (requestId !== requestIdRef.current) return;

      if (!res.ok) {
        setError(body.error || body.details || "Failed to load companies");
        setLoading(false);
        return;
      }

      const resolvedTotalPages = body.totalPages || 1;
      if (page > resolvedTotalPages && resolvedTotalPages > 0) {
        setPage(resolvedTotalPages);
        setLoading(false);
        return;
      }

      setError(null);
      setCompanies(body.companies || []);
      setPipeline(body.pipeline || []);
      setFollowUps(body.followUps || { overdue: [], dueToday: [] });
      setTotal(body.total || 0);
      setTotalPages(resolvedTotalPages);
      setPage(body.page || page);
      setPageSize(body.pageSize || pageSize);
      setLoading(false);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("CRM backend unavailable. Check Mongo connectivity.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(queryInput.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [queryInput]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard({
        q: debouncedQuery,
        status: statusFilter,
        priority: priorityFilter,
        page,
        pageSize,
      });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [debouncedQuery, loadDashboard, page, pageSize, priorityFilter, statusFilter]);

  async function createCompany(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      tags: parseCsv(form.tags),
      phones: parseCsv(form.phones),
      emails: parseCsv(form.emails),
      addresses: [],
      nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : null,
      lastTouchAt: null,
    };

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Failed to create company");
      return;
    }

    setCreateModalOpen(false);
    setForm(EMPTY_COMPANY_FORM);
    setPage(1);
    setLoading(true);
    setError(null);
    await loadDashboard({ q: debouncedQuery, status: statusFilter, priority: priorityFilter, page: 1, pageSize });
  }

  async function deleteCompany(id: string, name: string) {
    if (!window.confirm(`Delete ${name}? This will permanently remove the company, all people, and all timeline activity.`)) {
      return;
    }

    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete company");
      return;
    }

    setLoading(true);
    setError(null);
    await loadDashboard({ q: debouncedQuery, status: statusFilter, priority: priorityFilter, page, pageSize });
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      setError("Failed to update status");
      return;
    }

    setLoading(true);
    setError(null);
    await loadDashboard({ q: debouncedQuery, status: statusFilter, priority: priorityFilter, page, pageSize });
  }

  async function updatePriority(id: string, priority: CompanyPriority) {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });

    if (!res.ok) {
      setError("Failed to update priority");
      return;
    }

    setLoading(true);
    setError(null);
    await loadDashboard({ q: debouncedQuery, status: statusFilter, priority: priorityFilter, page, pageSize });
  }

  async function followUpAction(companyId: string, action: "done" | "snooze" | "reschedule") {
    const body: { companyId: string; action: string; until?: string | null } = { companyId, action };
    if (action === "reschedule") {
      body.until = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString();
    }

    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setError("Failed follow-up action");
      return;
    }

    setLoading(true);
    setError(null);
    await loadDashboard({ q: debouncedQuery, status: statusFilter, priority: priorityFilter, page, pageSize });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function resetFilters() {
    setLoading(true);
    setError(null);
    setQueryInput("");
    setDebouncedQuery("");
    setStatusFilter("");
    setPriorityFilter("");
    setPage(1);
  }

  const openFollowUpCount = followUps.overdue.length + followUps.dueToday.length;
  const hasActiveFilters = Boolean(queryInput.trim() || statusFilter || priorityFilter);
  const pipelineWithCounts = useMemo(() => pipeline.filter((item) => item.count > 0), [pipeline]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.7),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/90 px-5 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)] md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500">Wahlu CRM</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Company command centre</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_COMPANY_FORM);
                setCreateModalOpen(true);
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} /> Add company
            </button>
            <button
              onClick={logout}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </header>

        {error ? (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="crm-surface overflow-hidden p-4 md:p-5">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Companies</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <SummaryChip icon={<Building2 size={14} />} label="Companies" value={total} tone="slate" />
                <SummaryChip icon={<Clock3 size={14} />} label="Overdue" value={followUps.overdue.length} tone="rose" />
                <SummaryChip icon={<CalendarClock size={14} />} label="Due today" value={followUps.dueToday.length} tone="amber" />
                {pipelineWithCounts.map((item) => (
                  <SummaryChip key={item.status} label={item.status} value={item.count} tone="slate" />
                ))}
              </div>
            </div>

            {openFollowUpCount > 0 ? (
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                <FollowUpPanel title="Overdue" items={followUps.overdue} emptyLabel="Nothing overdue." accent="rose" onAction={followUpAction} />
                <FollowUpPanel title="Due today" items={followUps.dueToday} emptyLabel="Nothing due today." accent="amber" onAction={followUpAction} />
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
              <label className="block flex-1 text-sm">
                <span className="mb-1.5 block font-medium text-slate-700">Search</span>
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Search name, industry, website, Instagram, phone"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                    value={queryInput}
                    onChange={(event) => {
                      setLoading(true);
                      setError(null);
                      setQueryInput(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </label>
              <FilterSelect
                label="Status"
                value={statusFilter}
                options={["", ...COMPANY_STATUSES]}
                onChange={(value) => {
                  setLoading(true);
                  setError(null);
                  setStatusFilter(value);
                  setPage(1);
                }}
              />
              <FilterSelect
                label="Priority"
                value={priorityFilter}
                options={["", ...COMPANY_PRIORITIES]}
                onChange={(value) => {
                  setLoading(true);
                  setError(null);
                  setPriorityFilter(value);
                  setPage(1);
                }}
              />
              <div className="flex gap-2 lg:pb-0.5">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    void loadDashboard({ q: debouncedQuery, status: statusFilter, priority: priorityFilter, page, pageSize });
                  }}
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Company list table</caption>
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Links</th>
                  <th className="px-4 py-3">Primary contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Next touch</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={`loading-${index}`} className="align-top">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="h-4 w-44 animate-pulse rounded-full bg-slate-100" />
                          <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16">
                      <div className="mx-auto max-w-md text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                          <Building2 size={18} />
                        </div>
                        <p className="mt-4 text-base font-semibold text-slate-800">No companies in this view</p>
                        <p className="mt-1 text-sm text-slate-500">Clear the filters or add a new company to start building the pipeline.</p>
                        <div className="mt-4 flex justify-center gap-2">
                          {hasActiveFilters ? (
                            <button
                              type="button"
                              onClick={resetFilters}
                              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              Clear filters
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setForm(EMPTY_COMPANY_FORM);
                              setCreateModalOpen(true);
                            }}
                            className="cursor-pointer rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Add company
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => {
                    const primary = company.primaryContact;
                    const primaryEmail = primary?.emails?.[0] || company.emails?.[0] || "";
                    const primaryPhone = primary?.phones?.[0] || company.phones?.[0] || "";
                    const igHref = instagramHref(company);
                    const siteHref = ensureUrl(company.website);

                    return (
                      <tr key={company._id} className="align-top transition hover:bg-slate-50/90">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-950">{company.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{company.industry || "No industry yet"}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">{company.source}</span>
                            {company.assignedTo ? <span>Owner: {company.assignedTo}</span> : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {igHref ? (
                              <QuickLink href={igHref} icon={<Instagram size={13} />} label={instagramLabel(company)} />
                            ) : null}
                            {siteHref ? (
                              <QuickLink href={siteHref} icon={<Globe size={13} />} label={websiteLabel(company.website)} />
                            ) : null}
                            {!igHref && !siteHref ? <span className="text-xs text-slate-400">No public links</span> : null}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                            <UserRound size={14} className="text-slate-400" />
                            <span>{primary?.fullName || "No primary contact"}</span>
                          </div>
                          {primaryEmail ? <div className="mt-1 text-xs text-slate-500">{primaryEmail}</div> : null}
                          {primaryPhone ? <div className="text-xs text-slate-500">{primaryPhone}</div> : null}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
                            value={company.status}
                            onChange={(event) => updateStatus(company._id, event.target.value)}
                          >
                            {COMPANY_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-400"
                            value={company.priority}
                            onChange={(event) => updatePriority(company._id, event.target.value as CompanyPriority)}
                          >
                            {COMPANY_PRIORITIES.map((priority) => (
                              <option key={priority} value={priority}>
                                {priority}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          <div>
                            <span className="font-medium text-slate-700">Follow-up:</span> {formatDate(company.nextFollowUpAt)}
                          </div>
                          <div className="mt-1">
                            <span className="font-medium text-slate-700">Last touch:</span> {formatDate(company.lastTouchAt)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/companies/${company._id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <ArrowDownUp size={13} /> Open
                            </Link>
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                              onClick={() => deleteCompany(company._id, company.name)}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <div>
              Page {page} of {totalPages} · {total.toLocaleString()} companies
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                <span>Page size</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    const nextSize = Number(event.target.value);
                    setLoading(true);
                    setError(null);
                    setPageSize(nextSize);
                    setPage(1);
                  }}
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-slate-400"
                >
                  {[25, 50, 100, 200].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setPage((current) => Math.max(1, current - 1));
                }}
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setPage((current) => Math.min(totalPages, current + 1));
                }}
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      <CompanyEditorModal
        open={createModalOpen}
        form={form}
        saving={saving}
        onClose={() => {
          setCreateModalOpen(false);
          setForm(EMPTY_COMPANY_FORM);
        }}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        onSubmit={createCompany}
        title="Add company"
        submitLabel="Create company"
      />
    </main>
  );
}

function SummaryChip({
  icon,
  label,
  value,
  tone,
}: {
  icon?: ReactNode;
  label: string;
  value: number;
  tone: "slate" | "rose" | "amber";
}) {
  const toneClass = tone === "rose"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${toneClass}`}>
      {icon ? <span>{icon}</span> : null}
      <span className="font-medium">{label}</span>
      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function FollowUpPanel({
  title,
  items,
  emptyLabel,
  accent,
  onAction,
}: {
  title: string;
  items: Company[];
  emptyLabel: string;
  accent: "rose" | "amber";
  onAction: (companyId: string, action: "done" | "snooze" | "reschedule") => void;
}) {
  const tone = accent === "rose"
    ? "border-rose-200 bg-rose-50/60"
    : "border-amber-200 bg-amber-50/70";

  return (
    <div className={`rounded-[24px] border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{items.length}</span>
      </div>

      <div className="mt-3 space-y-2">
        {items.slice(0, 3).map((company) => (
          <div key={company._id} className="rounded-2xl border border-white/70 bg-white px-3 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{company.name}</div>
                <div className="mt-1 text-xs text-slate-500">{formatDate(company.nextFollowUpAt)}</div>
              </div>
              <Link href={`/companies/${company._id}`} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-950">
                Open <ExternalLink size={12} />
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
              <button type="button" className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-emerald-700 transition hover:bg-emerald-100" onClick={() => onAction(company._id, "done")}>
                <CheckCircle2 size={12} /> Done
              </button>
              <button type="button" className="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50" onClick={() => onAction(company._id, "snooze")}>
                Snooze
              </button>
              <button type="button" className="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50" onClick={() => onAction(company._id, "reschedule")}>
                +2 days
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-3 py-3 text-sm text-slate-500">{emptyLabel}</p> : null}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm lg:w-[180px]">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option || "all"} value={option}>
            {option || "All"}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      {icon}
      <span className="max-w-[160px] truncate">{label}</span>
    </a>
  );
}
