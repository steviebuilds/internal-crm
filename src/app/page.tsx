"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
import { Lead, LeadPriority, LeadSource, LeadStatus } from "@/lib/types";

type LeadForm = {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  value: number;
  notes: string;
  tags: string;
};

const EMPTY_FORM: LeadForm = {
  company: "",
  contactName: "",
  email: "",
  phone: "",
  source: "Website",
  status: "New",
  priority: "Medium",
  value: 0,
  notes: "",
  tags: "",
};

export default function HomePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);

  const filtered = useMemo(() => leads, [leads]);

  async function loadLeads() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);

    const res = await fetch(`/api/leads?${params.toString()}`);
    setLoading(false);

    if (!res.ok) {
      setError("Failed to load leads");
      return;
    }

    const data = (await res.json()) as Lead[];
    setLeads(data);
  }

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createLead(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      nextFollowUpAt: null,
      lastTouchAt: null,
    };

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Failed to create lead");
      return;
    }

    setForm(EMPTY_FORM);
    await loadLeads();
  }

  async function deleteLead(id: string) {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete lead");
      return;
    }
    await loadLeads();
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError("Failed to update status");
      return;
    }
    await loadLeads();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">CRM v1</h1>
          <p className="text-sm text-slate-600">Leads baseline: CRUD, search, filters, auth gate.</p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Log out
        </button>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={createLead}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">Add lead</h2>

          <Input label="Company" value={form.company} onChange={(v) => setForm((f) => ({ ...f, company: v }))} required />
          <Input
            label="Contact name"
            value={form.contactName}
            onChange={(v) => setForm((f) => ({ ...f, contactName: v }))}
            required
          />
          <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Source"
              value={form.source}
              options={LEAD_SOURCES}
              onChange={(v) => setForm((f) => ({ ...f, source: v as LeadSource }))}
            />
            <Select
              label="Priority"
              value={form.priority}
              options={LEAD_PRIORITIES}
              onChange={(v) => setForm((f) => ({ ...f, priority: v as LeadPriority }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Status"
              value={form.status}
              options={LEAD_STATUSES}
              onChange={(v) => setForm((f) => ({ ...f, status: v as LeadStatus }))}
            />
            <Input
              label="Value ($)"
              type="number"
              value={String(form.value)}
              onChange={(v) => setForm((f) => ({ ...f, value: Number(v) || 0 }))}
            />
          </div>

          <Input label="Tags (comma-separated)" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Notes</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>

          <button
            disabled={saving}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Create lead"}
          </button>
        </form>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-56 flex-1 text-sm">
              <span className="mb-1 block font-medium text-slate-700">Search</span>
              <input
                placeholder="Company or contact"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <Select label="Status" value={statusFilter} options={["", ...LEAD_STATUSES]} onChange={setStatusFilter} />
            <Select
              label="Priority"
              value={priorityFilter}
              options={["", ...LEAD_PRIORITIES]}
              onChange={setPriorityFilter}
            />
            <button
              onClick={loadLeads}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Apply
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-2 py-2">Company</th>
                  <th className="px-2 py-2">Contact</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Priority</th>
                  <th className="px-2 py-2">Value</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-2 py-4 text-slate-500" colSpan={6}>
                      Loading leads...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-2 py-4 text-slate-500" colSpan={6}>
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => (
                    <tr key={lead._id} className="border-b border-slate-100">
                      <td className="px-2 py-2">
                        <div className="font-medium text-slate-900">{lead.company}</div>
                        <div className="text-xs text-slate-500">{lead.email}</div>
                      </td>
                      <td className="px-2 py-2">{lead.contactName}</td>
                      <td className="px-2 py-2">
                        <select
                          className="rounded-md border border-slate-300 px-2 py-1"
                          value={lead.status}
                          onChange={(e) => updateStatus(lead._id, e.target.value)}
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">{lead.priority}</td>
                      <td className="px-2 py-2">${lead.value.toLocaleString()}</td>
                      <td className="px-2 py-2">
                        <button
                          className="text-rose-600 hover:text-rose-800"
                          onClick={() => deleteLead(lead._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
      >
        {options.map((opt) => (
          <option key={opt || "all"} value={opt}>
            {opt || "All"}
          </option>
        ))}
      </select>
    </label>
  );
}
