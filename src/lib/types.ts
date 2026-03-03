export type LeadStatus =
  | "New"
  | "Contacted"
  | "Demo Sent"
  | "Interested"
  | "Won"
  | "Lost";

export type LeadPriority = "Low" | "Medium" | "High";

export type LeadSource =
  | "Website"
  | "Referral"
  | "Cold Outreach"
  | "LinkedIn"
  | "Event"
  | "Other";

export type Lead = {
  _id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  value: number;
  notes: string;
  tags: string[];
  lastTouchAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  _id: string;
  leadId: string;
  type: "call" | "email" | "note" | "status-change";
  body: string;
  createdAt: string;
  updatedAt: string;
};
