export type CompanyStatus =
  | "New"
  | "Contacted"
  | "Demo Sent"
  | "Interested"
  | "Won"
  | "Lost";

export type CompanyPriority = "Low" | "Medium" | "High";

export type CompanySource =
  | "Website"
  | "Referral"
  | "Cold Outreach"
  | "LinkedIn"
  | "Event"
  | "Other";

export type Company = {
  _id: string;
  name: string;
  website: string;
  industry: string;
  status: CompanyStatus;
  priority: CompanyPriority;
  source: CompanySource;
  tags: string[];
  notes: string;
  instagramHandle: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  xUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  addresses: string[];
  phones: string[];
  emails: string[];
  assignedTo: string;
  lastTouchAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Person = {
  _id: string;
  companyId: string;
  fullName: string;
  role: string;
  phones: string[];
  emails: string[];
  linkedinUrl: string;
  instagramHandle: string;
  instagramUrl: string;
  confidenceScore: number;
  confidenceSource: string;
  confidenceNotes: string;
  notes: string;
  isPrimaryContact: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  _id: string;
  companyId: string;
  type: "call" | "email" | "note" | "status-change";
  body: string;
  createdAt: string;
  updatedAt: string;
};
