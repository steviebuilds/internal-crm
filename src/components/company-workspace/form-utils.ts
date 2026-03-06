import { Company, CompanyPriority, CompanySource, CompanyStatus, Person } from "@/lib/types";

export type CompanyForm = {
  name: string;
  website: string;
  industry: string;
  emails: string;
  phones: string;
  assignedTo: string;
  instagramHandle: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  xUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  source: CompanySource;
  status: CompanyStatus;
  priority: CompanyPriority;
  tags: string;
  notes: string;
  nextFollowUpAt: string;
};

export const EMPTY_COMPANY_FORM: CompanyForm = {
  name: "",
  website: "",
  industry: "",
  emails: "",
  phones: "",
  assignedTo: "",
  instagramHandle: "",
  instagramUrl: "",
  facebookUrl: "",
  linkedinUrl: "",
  xUrl: "",
  tiktokUrl: "",
  youtubeUrl: "",
  source: "Website",
  status: "New",
  priority: "Medium",
  tags: "",
  notes: "",
  nextFollowUpAt: "",
};

export type PersonForm = {
  fullName: string;
  role: string;
  phones: string;
  emails: string;
  linkedinUrl: string;
  instagramHandle: string;
  instagramUrl: string;
  notes: string;
  isPrimaryContact: boolean;
};

export const EMPTY_PERSON_FORM: PersonForm = {
  fullName: "",
  role: "",
  phones: "",
  emails: "",
  linkedinUrl: "",
  instagramHandle: "",
  instagramUrl: "",
  notes: "",
  isPrimaryContact: false,
};

export function parseCsv(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toCompanyForm(company: Company): CompanyForm {
  return {
    name: company.name,
    website: company.website || "",
    industry: company.industry || "",
    emails: (company.emails || []).join(", "),
    phones: (company.phones || []).join(", "),
    assignedTo: company.assignedTo || "",
    instagramHandle: company.instagramHandle || "",
    instagramUrl: company.instagramUrl || "",
    facebookUrl: company.facebookUrl || "",
    linkedinUrl: company.linkedinUrl || "",
    xUrl: company.xUrl || "",
    tiktokUrl: company.tiktokUrl || "",
    youtubeUrl: company.youtubeUrl || "",
    source: company.source,
    status: company.status,
    priority: company.priority,
    tags: (company.tags || []).join(", "),
    notes: company.notes || "",
    nextFollowUpAt: toDateTimeLocal(company.nextFollowUpAt),
  };
}

export function toPersonForm(person?: Person | null): PersonForm {
  if (!person) return EMPTY_PERSON_FORM;

  return {
    fullName: person.fullName || "",
    role: person.role || "",
    phones: (person.phones || []).join(", "),
    emails: (person.emails || []).join(", "),
    linkedinUrl: person.linkedinUrl || "",
    instagramHandle: person.instagramHandle || "",
    instagramUrl: person.instagramUrl || "",
    notes: person.notes || "",
    isPrimaryContact: Boolean(person.isPrimaryContact),
  };
}
