"use client";

import { PersonForm } from "./form-utils";
import { Area, Field, Modal } from "./Modal";

export function PersonEditorModal({
  open,
  form,
  mode,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  form: PersonForm;
  mode: "create" | "edit";
  saving: boolean;
  onClose: () => void;
  onChange: (patch: Partial<PersonForm>) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Add contact" : "Edit contact"}
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
            form="person-editor-form"
            disabled={saving}
            className="cursor-pointer rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : mode === "create" ? "Add contact" : "Save contact"}
          </button>
        </div>
      }
    >
      <form id="person-editor-form" onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" value={form.fullName} onChange={(value) => onChange({ fullName: value })} required />
          <Field label="Role" value={form.role} onChange={(value) => onChange({ role: value })} />
          <Field label="Phones" value={form.phones} onChange={(value) => onChange({ phones: value })} />
          <Field label="Emails" value={form.emails} onChange={(value) => onChange({ emails: value })} />
          <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={(value) => onChange({ linkedinUrl: value })} />
          <Field label="Instagram handle" value={form.instagramHandle} onChange={(value) => onChange({ instagramHandle: value })} />
          <div className="md:col-span-2">
            <Field label="Instagram URL" value={form.instagramUrl} onChange={(value) => onChange({ instagramUrl: value })} />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isPrimaryContact}
            onChange={(event) => onChange({ isPrimaryContact: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="font-medium">Primary contact</span>
        </label>

        <Area label="Internal notes" value={form.notes} onChange={(value) => onChange({ notes: value })} rows={4} />
      </form>
    </Modal>
  );
}
