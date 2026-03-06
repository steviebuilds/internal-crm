"use client";

import { COMPANY_PRIORITIES, COMPANY_SOURCES, COMPANY_STATUSES } from "@/lib/constants";
import { CompanyForm } from "./form-utils";
import { Area, Field, Modal, SelectField } from "./Modal";

export function CompanyEditorModal({
  open,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: CompanyForm | null;
  saving: boolean;
  onClose: () => void;
  onChange: (patch: Partial<CompanyForm>) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  if (!form) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit business"
      description="Update the core record without cluttering the main workspace."
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="company-editor-form"
            disabled={saving}
            className="cursor-pointer rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save business"}
          </button>
        </div>
      }
    >
      <form id="company-editor-form" onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" value={form.name} onChange={(value) => onChange({ name: value })} required />
          <Field label="Website" value={form.website} onChange={(value) => onChange({ website: value })} />
          <Field label="Industry" value={form.industry} onChange={(value) => onChange({ industry: value })} />
          <Field label="Assigned to" value={form.assignedTo} onChange={(value) => onChange({ assignedTo: value })} />
          <Field label="Emails" value={form.emails} onChange={(value) => onChange({ emails: value })} />
          <Field label="Phones" value={form.phones} onChange={(value) => onChange({ phones: value })} />
          <Field label="Tags" value={form.tags} onChange={(value) => onChange({ tags: value })} />
          <Field
            label="Next follow-up"
            type="datetime-local"
            value={form.nextFollowUpAt}
            onChange={(value) => onChange({ nextFollowUpAt: value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Source" value={form.source} options={COMPANY_SOURCES} onChange={(value) => onChange({ source: value as CompanyForm["source"] })} />
          <SelectField label="Status" value={form.status} options={COMPANY_STATUSES} onChange={(value) => onChange({ status: value as CompanyForm["status"] })} />
          <SelectField label="Priority" value={form.priority} options={COMPANY_PRIORITIES} onChange={(value) => onChange({ priority: value as CompanyForm["priority"] })} />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Social links</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Instagram handle" value={form.instagramHandle} onChange={(value) => onChange({ instagramHandle: value })} />
            <Field label="Instagram URL" value={form.instagramUrl} onChange={(value) => onChange({ instagramUrl: value })} />
            <Field label="Facebook URL" value={form.facebookUrl} onChange={(value) => onChange({ facebookUrl: value })} />
            <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={(value) => onChange({ linkedinUrl: value })} />
            <Field label="X URL" value={form.xUrl} onChange={(value) => onChange({ xUrl: value })} />
            <Field label="TikTok URL" value={form.tiktokUrl} onChange={(value) => onChange({ tiktokUrl: value })} />
            <div className="md:col-span-2">
              <Field label="YouTube URL" value={form.youtubeUrl} onChange={(value) => onChange({ youtubeUrl: value })} />
            </div>
          </div>
        </div>

        <Area label="Internal notes" value={form.notes} onChange={(value) => onChange({ notes: value })} rows={5} />
      </form>
    </Modal>
  );
}
