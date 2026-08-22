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
  // Each createIndex is wrapped individually: concurrent cold starts (two dev
  // servers, overlapping restarts, parallel serverless invocations) can abort
  // each other's background index builds (MongoServerError 276). That's fine
  // to ignore — whichever build lands first satisfies the index for everyone
  // sharing the collection — but it must not reject this function, since a
  // rejection here would permanently poison the cached connection promise.
  const specs = [
    ["users", "mobile", { unique: true, sparse: true }],
    ["users", "google_id", { unique: true, sparse: true }],
    ["products", "slug", { unique: true }],
    ["products", "category", undefined],
    ["orders", "razorpay_order_id", undefined],
    ["orders", "user_id", undefined],
    ["addresses", "user_id", undefined],
    ["reviews", { product_id: 1, user_id: 1 }, { unique: true }],
  ];
  for (const [collection, keys, options] of specs) {
    try {
      await db.collection(collection).createIndex(keys, options);
    } catch (err) {
      console.error(`ensureIndexes: failed to create index on ${collection}`, err.message);
    }
  }
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
    })().catch((err) => {
      // Don't leave a rejected promise cached — a transient connect failure
      // would otherwise break every future getDb() call in this process
      // until restart. Let the next call retry from scratch.
      cached.initPromise = null;
      throw err;
    });
  }
  return cached.initPromise;
}
