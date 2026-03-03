import { connectDb } from "@/lib/db";
import mongoose from "mongoose";

function normList(values: unknown[] | undefined) {
  return [...new Set((values || []).map((v) => String(v).trim()).filter(Boolean))];
}

function splitFromNotes(notes: string, regex: RegExp) {
  return [...(notes || "").matchAll(regex)].map((m) => (m[0] || "").trim());
}

function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Mongo DB connection is not initialized");
  return db;
}

async function ensureCompaniesShape() {
  const db = getDb();
  const companies = db.collection("companies");

  const cursor = companies.find({});
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;

    const notes = String(doc.notes || "");
    const emails = normList([
      ...(doc.emails || []),
      doc.email,
      ...splitFromNotes(notes, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi),
    ]);
    const phones = normList([
      ...(doc.phones || []),
      doc.phone,
      ...splitFromNotes(notes, /(?:\+?\d[\d\s().-]{6,}\d)/g),
    ]);

    await companies.updateOne(
      { _id: doc._id },
      {
        $set: {
          name: doc.name || doc.company || "",
          website: doc.website || "",
          industry: doc.industry || "",
          assignedTo: doc.assignedTo || "",
          emails,
          phones,
          addresses: normList(doc.addresses || []),
          tags: normList(doc.tags || []),
          notes,
          instagramHandle: doc.instagramHandle || "",
          instagramUrl: doc.instagramUrl || "",
          facebookUrl: doc.facebookUrl || "",
          linkedinUrl: doc.linkedinUrl || "",
          xUrl: doc.xUrl || "",
          tiktokUrl: doc.tiktokUrl || "",
          youtubeUrl: doc.youtubeUrl || "",
          source: doc.source || "Other",
          status: doc.status || "New",
          priority: doc.priority || "Medium",
        },
        $unset: {
          company: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          phone: "",
          email: "",
          altPhones: "",
          altEmails: "",
          sourceTabs: "",
          value: "",
        },
      },
    );
  }
}

async function migrateCollections() {
  const db = getDb();
  const collections = (await db.listCollections().toArray()).map((c) => c.name);

  if (collections.includes("leads") && !collections.includes("companies")) {
    console.log("Renaming leads -> companies collection...");
    await db.collection("leads").rename("companies");
  }

  if (collections.includes("activities")) {
    console.log("Migrating activities.leadId -> companyId...");
    await db.collection("activities").updateMany(
      { leadId: { $exists: true } },
      [
        { $set: { companyId: "$leadId" } },
        { $unset: "leadId" },
      ],
    );
  }
}

async function backfillPeople({ threshold }: { threshold: number }) {
  const db = getDb();
  const companies = db.collection("companies");
  const people = db.collection("people");

  const cursor = companies.find({});
  let created = 0;

  while (await cursor.hasNext()) {
    const company = await cursor.next();
    if (!company) continue;

    const existingPrimary = await people.findOne({ companyId: company._id, isPrimaryContact: true });
    if (existingPrimary) continue;

    const fullName = String(company.contactName || "").trim();
    const email = String(company.contactEmail || company.email || "").trim();
    const phone = String(company.contactPhone || company.phone || "").trim();

    let confidence = 0;
    if (fullName && fullName.includes(" ")) confidence += 0.5;
    if (email) confidence += 0.3;
    if (phone) confidence += 0.2;

    if (confidence >= threshold && fullName) {
      await people.insertOne({
        companyId: company._id,
        fullName,
        role: "",
        phones: phone ? [phone] : [],
        emails: email ? [email] : [],
        linkedinUrl: "",
        instagramHandle: "",
        instagramUrl: "",
        confidenceScore: confidence,
        confidenceSource: "lead-migration",
        confidenceNotes: "Auto-linked during lead->company migration",
        notes: "",
        isPrimaryContact: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      created++;
    } else if (fullName || email || phone) {
      const marker = `\n[unverified-contact] ${fullName || "unknown"} ${email} ${phone}`.trim();
      await companies.updateOne({ _id: company._id }, { $set: { notes: `${company.notes || ""}${marker}` } });
    }
  }

  console.log(`People created: ${created}`);
}

async function run() {
  const thresholdArg = process.argv.find((arg) => arg.startsWith("--threshold="));
  const threshold = thresholdArg ? Number(thresholdArg.split("=")[1]) : 0.8;

  await connectDb();
  await migrateCollections();
  await ensureCompaniesShape();
  await backfillPeople({ threshold });

  console.log("Migration complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
