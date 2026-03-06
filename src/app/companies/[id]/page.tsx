"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import { CompanyEditorModal } from "@/components/company-workspace/CompanyEditorModal";
import { PersonEditorModal } from "@/components/company-workspace/PersonEditorModal";
import {
  CompanyForm,
  EMPTY_PERSON_FORM,
  parseCsv,
  PersonForm,
  toCompanyForm,
  toPersonForm,
} from "@/components/company-workspace/form-utils";
import { Activity, Company, Person } from "@/lib/types";

function formatDateTime(value?: string | null) {
  if (!value) return "None";
  return new Date(value).toLocaleString();
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function statusTone(status: Company["status"]) {
  switch (status) {
    case "Won":
      return "bg-emerald-100 text-emerald-800";
    case "Lost":
      return "bg-rose-100 text-rose-700";
    case "Interested":
      return "bg-amber-100 text-amber-800";
    case "Demo Sent":
      return "bg-sky-100 text-sky-800";
    case "Contacted":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

function activityTone(type: Activity["type"]) {
  switch (type) {
    case "call":
      return "bg-sky-100 text-sky-800";
    case "email":
      return "bg-amber-100 text-amber-800";
    case "status-change":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

export default function CompanyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [companyForm, setCompanyForm] = useState<CompanyForm | null>(null);
  const [personForm, setPersonForm] = useState<PersonForm>(EMPTY_PERSON_FORM);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingPerson, setSavingPerson] = useState(false);
  const [deletingPersonId, setDeletingPersonId] = useState<string | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const [companyRes, actRes, peopleRes] = await Promise.all([
      fetch(`/api/companies/${id}`),
      fetch(`/api/companies/${id}/activities`),
      fetch(`/api/companies/${id}/people?page=1&pageSize=100`),
    ]);

    if (!companyRes.ok || !actRes.ok || !peopleRes.ok) {
      setError("Failed to load company detail");
      return;
    }

    const companyData = (await companyRes.json()) as Company;
    setCompany(companyData);
    setCompanyForm(toCompanyForm(companyData));
    setActivities((await actRes.json()) as Activity[]);
    const peopleData = (await peopleRes.json()) as { people: Person[] };
    setPeople(peopleData.people || []);
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const socialLinks = useMemo(() => {
    if (!company) return [];
    return [
      { label: "Website", href: company.website, icon: Globe },
      { label: "Instagram", href: company.instagramUrl, icon: Instagram },
      { label: "Facebook", href: company.facebookUrl, icon: Facebook },
      { label: "LinkedIn", href: company.linkedinUrl, icon: Linkedin },
      { label: "X", href: company.xUrl, icon: ExternalLink },
    ].filter((item) => item.href);
  }, [company]);

  function openCreatePersonModal() {
    setEditingPerson(null);
    setPersonForm(EMPTY_PERSON_FORM);
    setPersonModalOpen(true);
  }

  function openEditPersonModal(person: Person) {
    setEditingPerson(person);
    setPersonForm(toPersonForm(person));
    setPersonModalOpen(true);
  }

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!noteBody.trim()) return;

    setSavingNote(true);
    setError(null);

    const res = await fetch(`/api/companies/${id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", body: noteBody.trim() }),
    });

    setSavingNote(false);
    if (!res.ok) {
      setError("Failed to add note");
      return;
    }

    setNoteBody("");
    await load();
  }

  async function savePerson(event: React.FormEvent) {
    event.preventDefault();
    if (!personForm.fullName.trim()) return;

    setSavingPerson(true);
    setError(null);

    const payload = {
      companyId: id,
      fullName: personForm.fullName,
      role: personForm.role,
      phones: parseCsv(personForm.phones),
      emails: parseCsv(personForm.emails),
      linkedinUrl: personForm.linkedinUrl,
      instagramHandle: personForm.instagramHandle,
      instagramUrl: personForm.instagramUrl,
      notes: personForm.notes,
      isPrimaryContact: personForm.isPrimaryContact,
    };

    const res = await fetch(editingPerson ? `/api/people/${editingPerson._id}` : `/api/companies/${id}/people`, {
      method: editingPerson ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSavingPerson(false);
    if (!res.ok) {
      setError(editingPerson ? "Failed to save contact" : "Failed to add contact");
      return;
    }

    setPersonModalOpen(false);
    setEditingPerson(null);
    setPersonForm(EMPTY_PERSON_FORM);
    await load();
  }

  async function removePerson(personId: string) {
    setDeletingPersonId(personId);
    setError(null);

    const res = await fetch(`/api/people/${personId}`, { method: "DELETE" });

    setDeletingPersonId(null);
    if (!res.ok) {
      setError("Failed to remove contact");
      return;
    }

    await load();
  }

  async function saveCompany(event: React.FormEvent) {
    event.preventDefault();
    if (!companyForm) return;

    setSavingCompany(true);
    setError(null);

    const payload = {
      ...companyForm,
      tags: parseCsv(companyForm.tags),
      phones: parseCsv(companyForm.phones),
      emails: parseCsv(companyForm.emails),
      nextFollowUpAt: companyForm.nextFollowUpAt ? new Date(companyForm.nextFollowUpAt).toISOString() : null,
    };

    const res = await fetch(`/api/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSavingCompany(false);
    if (!res.ok) {
      setError("Failed to save company changes");
      return;
    }

    setCompanyModalOpen(false);
    await load();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.7),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold tracking-[0.2em] text-white">
                {company ? initials(company.name) : "--"}
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${company ? statusTone(company.status) : "bg-slate-100 text-slate-500"}`}>
                    {company?.status || "Loading"}
                  </span>
                  {company ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{company.source}</span> : null}
                  {company ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Priority {company.priority}</span> : null}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{company?.name || "Company workspace"}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setCompanyModalOpen(true)}
                disabled={!companyForm}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
                Edit business
              </button>
              <Link href="/" className="inline-flex cursor-pointer items-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950">
                Back
              </Link>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Business snapshot</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoTile label="Industry" value={company?.industry || "Not set"} />
              <InfoTile label="Assigned to" value={company?.assignedTo || "Unassigned"} />
              <InfoTile label="Last touch" value={formatDateTime(company?.lastTouchAt)} icon={CalendarDays} />
              <InfoTile label="Next follow-up" value={formatDateTime(company?.nextFollowUpAt)} icon={CalendarDays} />
              <InfoTile label="Phones" value={company?.phones?.join(", ") || "None"} icon={Phone} />
              <InfoTile label="Emails" value={company?.emails?.join(", ") || "None"} icon={Mail} />
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Socials and links</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.length ? (
                  socialLinks.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No social links saved yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Record details</h2>
            </div>
            <div className="space-y-4">
              <StackedInfo label="Address" value={company?.addresses?.join("\n") || "No address saved"} />
              <StackedInfo label="Tags" value={company?.tags?.length ? company.tags.join(", ") : "No tags"} />
              {company?.notes ? <StackedInfo label="Notes" value={company.notes} accent /> : null}
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Contacts</h2>
            </div>
            <button
              type="button"
              onClick={openCreatePersonModal}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add contact
            </button>
          </div>

          {people.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {people.map((person) => (
                <article key={person._id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-950">{person.fullName}</h3>
                        {person.isPrimaryContact ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">Primary</span> : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{person.role || "No role set"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditPersonModal(person)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removePerson(person._id)}
                        disabled={deletingPersonId === person._id}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>{person.emails.length ? person.emails.join(", ") : "No email saved"}</p>
                    <p>{person.phones.length ? person.phones.join(", ") : "No phone saved"}</p>
                    {person.instagramUrl || person.linkedinUrl ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {person.instagramUrl ? <InlineLink href={person.instagramUrl} label="Instagram" icon={Instagram} /> : null}
                        {person.linkedinUrl ? <InlineLink href={person.linkedinUrl} label="LinkedIn" icon={Linkedin} /> : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-500">No contacts added yet.</div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={addNote} className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-2 text-white">
                <StickyNote className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-950">Add note</h2>
              </div>
            </div>
            <textarea
              required
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Log the next thing that matters..."
              className="min-h-40 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingNote}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {savingNote ? "Saving..." : "Add note"}
              </button>
            </div>
          </form>

          <section className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Timeline</h2>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{activities.length} entries</span>
            </div>
            <div className="space-y-3">
              {activities.length === 0 ? <p className="text-sm text-slate-500">No activity yet.</p> : null}
              {activities.map((activity) => (
                <article key={activity._id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${activityTone(activity.type)}`}>
                      {activity.type}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{activity.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <CompanyEditorModal
        open={companyModalOpen}
        form={companyForm}
        saving={savingCompany}
        onClose={() => setCompanyModalOpen(false)}
        onChange={(patch) => setCompanyForm((current) => (current ? { ...current, ...patch } : current))}
        onSubmit={saveCompany}
      />

      <PersonEditorModal
        open={personModalOpen}
        form={personForm}
        mode={editingPerson ? "edit" : "create"}
        saving={savingPerson}
        onClose={() => {
          setPersonModalOpen(false);
          setEditingPerson(null);
          setPersonForm(EMPTY_PERSON_FORM);
        }}
        onChange={(patch) => setPersonForm((current) => ({ ...current, ...patch }))}
        onSubmit={savePerson}
      />
    </main>
  );
}

function InfoTile({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof CalendarDays }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function StackedInfo({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-[24px] border p-4 ${accent ? "border-dashed border-slate-300 bg-slate-50/60" : "border-slate-200 bg-slate-50"}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function InlineLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Globe }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
