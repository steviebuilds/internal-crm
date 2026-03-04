import type { AnyBulkWriteOperation, Document } from "mongodb";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db";
import { normalizeLegacyLead } from "@/lib/legacy/lead-normalization";

function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Mongo DB connection is not initialized");
  return db;
}

function hasArg(name: string) {
  return process.argv.includes(name);
}

async function run() {
  const apply = hasArg("--apply");
  const sampleSizeArg = process.argv.find((arg) => arg.startsWith("--sample="));
  const sampleSize = sampleSizeArg ? Number(sampleSizeArg.split("=")[1]) : 3;

  await connectDb();
  const db = getDb();

  const collections = (await db.listCollections().toArray()).map((c) => c.name);
  if (!collections.includes("leads")) {
    console.log("No legacy leads collection found. Nothing to migrate.");
    process.exit(0);
  }

  const leads = db.collection("leads");
  const companies = db.collection("companies");

  const cursor = leads.find({});

  let totalLeads = 0;
  let mappable = 0;
  let skippedMissingName = 0;
  let wouldInsert = 0;
  let wouldUpdate = 0;

  const now = new Date();
  const ops: AnyBulkWriteOperation<Document>[] = [];

  const samples: Array<{
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  }> = [];

  while (await cursor.hasNext()) {
    const legacy = await cursor.next();
    if (!legacy) continue;

    totalLeads += 1;

    const normalized = normalizeLegacyLead(legacy as Record<string, unknown>);
    if (!normalized.ok) {
      if (normalized.reason === "missing-name") skippedMissingName += 1;
      continue;
    }

    mappable += 1;

    const existing = await companies.findOne({ _id: legacy._id }, { projection: { _id: 1 } });
    if (existing) {
      wouldUpdate += 1;
    } else {
      wouldInsert += 1;
    }

    if (samples.length < sampleSize) {
      samples.push({
        before: {
          _id: String(legacy._id),
          name: legacy.name,
          company: legacy.company,
          companyName: legacy.companyName,
          business_name: legacy.business_name,
          status: legacy.status,
          priority: legacy.priority,
          email: legacy.email,
          phone: legacy.phone,
          createdAt: legacy.createdAt,
          updatedAt: legacy.updatedAt,
        },
        after: {
          _id: String(legacy._id),
          ...normalized.company,
        },
      });
    }

    if (apply) {
      ops.push({
        updateOne: {
          filter: { _id: legacy._id },
          update: {
            $set: {
              ...normalized.company,
              legacySource: "leads",
              legacyMigratedAt: now,
            },
            $setOnInsert: {
              createdAt: normalized.company.createdAt,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (apply && ops.length > 0) {
    await companies.bulkWrite(ops, { ordered: false });
  }

  console.log(`mode=${apply ? "apply" : "dry-run"}`);
  console.log(`totalLeads=${totalLeads}`);
  console.log(`mappable=${mappable}`);
  console.log(`skippedMissingName=${skippedMissingName}`);
  console.log(`wouldInsert=${wouldInsert}`);
  console.log(`wouldUpdate=${wouldUpdate}`);
  console.log(`appliedOps=${apply ? ops.length : 0}`);
  console.log("samples=" + JSON.stringify(samples, null, 2));

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
