import { GridFSBucket } from "mongodb";
import { getDb } from "@/lib/db/connect";

let cachedBucket = null;

export async function getBucket() {
  if (cachedBucket) return cachedBucket;
  const db = await getDb();
  cachedBucket = new GridFSBucket(db, { bucketName: "product_images" });
  return cachedBucket;
}
