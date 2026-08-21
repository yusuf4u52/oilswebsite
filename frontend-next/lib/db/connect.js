import { MongoClient } from "mongodb";
import { MONGO_URL, DB_NAME } from "@/lib/config/env";

// Cached across warm serverless invocations (and HMR reloads in dev) so we
// don't exhaust the Mongo host's connection limit by opening a fresh client
// per request. Mirrors the standard Next.js + MongoDB pattern.
let cached = globalThis.__mongo;
if (!cached) {
  cached = globalThis.__mongo = { client: null, db: null, initPromise: null };
}

async function ensureIndexes(db) {
  // Best-effort migration off an old pre-Google-auth unique-mobile index.
  // Safe to attempt on every cold start; ignored if the index doesn't exist.
  try {
    await db.collection("users").dropIndex("mobile_1");
  } catch {
    // ignore
  }
  await db.collection("users").createIndex("mobile", { unique: true, sparse: true });
  await db.collection("users").createIndex("google_id", { unique: true, sparse: true });
  await db.collection("products").createIndex("slug", { unique: true });
  await db.collection("products").createIndex("category");
  await db.collection("orders").createIndex("razorpay_order_id");
  await db.collection("orders").createIndex("user_id");
  await db.collection("addresses").createIndex("user_id");
  await db.collection("reviews").createIndex({ product_id: 1, user_id: 1 }, { unique: true });
}

export async function getDb() {
  if (cached.db) return cached.db;
  if (!cached.initPromise) {
    cached.initPromise = (async () => {
      const client = new MongoClient(MONGO_URL);
      await client.connect();
      const db = client.db(DB_NAME);
      await ensureIndexes(db);
      cached.client = client;
      cached.db = db;
      return db;
    })();
  }
  return cached.initPromise;
}
