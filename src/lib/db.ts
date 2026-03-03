import mongoose from "mongoose";

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | null;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not configured");
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDb() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const mongoUri = MONGODB_URI as string;
    cached!.promise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || "crm_v1",
      autoIndex: true,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
