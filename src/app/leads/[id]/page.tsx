"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ACTIVITY_TYPES } from "@/lib/constants";
import { Activity, Lead } from "@/lib/types";

export default function LeadTimelinePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [body, setBody] = useState("");
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]>("note");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const [leadRes, actRes] = await Promise.all([
      fetch(`/api/leads/${id}`),
      fetch(`/api/leads/${id}/activities`),
    ]);

    if (!leadRes.ok || !actRes.ok) {
      setError("Failed to load lead timeline");
      return;
    }

    setLead((await leadRes.json()) as Lead);
    setActivities((await actRes.json()) as Activity[]);
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addActivity(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/leads/${id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, body }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Failed to add activity");
      return;
    }

    setBody("");
    setType("note");
    await load();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Lead timeline</h1>
          {lead ? (
            <p className="text-sm text-slate-600">
              {lead.company} · {lead.contactName}
            </p>
          ) : null}
        </div>
        <Link href="/" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">
          Back
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <form onSubmit={addActivity} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Quick add activity</h2>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Type</span>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as (typeof ACTIVITY_TYPES)[number])}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Details</span>
          <textarea
            required
            className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <button
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {saving ? "Adding..." : "Add activity"}
        </button>
      </form>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Timeline</h2>
        {activities.length === 0 ? <p className="text-sm text-slate-500">No activity yet.</p> : null}
        {activities.map((act) => (
          <article key={act._id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-700">
                {act.type}
              </span>
              <span className="text-slate-500">{new Date(act.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-slate-800">{act.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
