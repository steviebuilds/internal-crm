import { connectDb } from "@/lib/db";
import { CompanyModel } from "@/lib/models/Company";
import { PersonModel } from "@/lib/models/Person";

async function run() {
  await connectDb();

  const existing = await CompanyModel.countDocuments();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} companies already exist.`);
    process.exit(0);
  }

  const companies = await CompanyModel.insertMany([
    {
      name: "Northstar Fitness",
      website: "https://northstarfit.com",
      industry: "Fitness",
      source: "Referral",
      status: "Contacted",
      priority: "High",
      tags: ["gym", "high-intent"],
      notes: "Warm intro from Adam.",
      phones: ["+1 555-0101"],
      emails: ["hello@northstarfit.com"],
      instagramHandle: "northstarfit",
      lastTouchAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
    {
      name: "Summit Labs",
      website: "https://summitlabs.io",
      industry: "SaaS",
      source: "LinkedIn",
      status: "New",
      priority: "Medium",
      tags: ["saas"],
      notes: "Interested in pilot for Q2.",
      emails: ["info@summitlabs.io"],
      nextFollowUpAt: new Date(),
    },
  ]);

  await PersonModel.insertMany([
    {
      companyId: companies[0]._id,
      fullName: "Jenna Cole",
      role: "Owner",
      phones: ["+1 555-0101"],
      emails: ["jenna@northstarfit.com"],
      isPrimaryContact: true,
      confidenceSource: "seed",
      confidenceScore: 1,
    },
    {
      companyId: companies[1]._id,
      fullName: "Ben Rivera",
      role: "Head of Ops",
      emails: ["ben@summitlabs.io"],
      isPrimaryContact: true,
      confidenceSource: "seed",
      confidenceScore: 1,
    },
  ]);

  console.log("Seed complete: added 2 companies and 2 people.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
