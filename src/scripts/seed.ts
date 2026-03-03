import { connectDb } from "@/lib/db";
import { LeadModel } from "@/lib/models/Lead";

async function run() {
  await connectDb();

  const existing = await LeadModel.countDocuments();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} leads already exist.`);
    process.exit(0);
  }

  await LeadModel.insertMany([
    {
      company: "Northstar Fitness",
      contactName: "Jenna Cole",
      email: "jenna@northstarfit.com",
      phone: "+1 555-0101",
      source: "Referral",
      status: "Contacted",
      priority: "High",
      value: 8000,
      notes: "Warm intro from Adam.",
      tags: ["gym", "high-intent"],
      lastTouchAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
    {
      company: "Summit Labs",
      contactName: "Ben Rivera",
      email: "ben@summitlabs.io",
      phone: "+1 555-0102",
      source: "LinkedIn",
      status: "New",
      priority: "Medium",
      value: 3200,
      notes: "Interested in pilot for Q2.",
      tags: ["saas"],
      lastTouchAt: null,
      nextFollowUpAt: new Date(),
    },
  ]);

  console.log("Seed complete: added 2 leads.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
