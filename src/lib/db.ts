import mongoose from "mongoose";

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | null;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

function getDbName() {
  return (
    process.env.MONGODB_DB ||
    process.env.MONGODB_DATABASE ||
    process.env.MONGO_DB ||
    process.env.MONGO_DB_NAME ||
    "crm_v1"
  );
}

export async function connectDb() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not configured");
    }

    cached!.promise = mongoose.connect(mongoUri, {
      dbName: getDbName(),
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
