import { randomUUID } from "crypto";
import { getDb } from "@/lib/db/connect";

function nowIso() {
  return new Date().toISOString();
}

// Python's Pydantic auto-fills a missing ProductVariant.id at request-parse time;
// replicate that explicitly here for both create and update paths.
function normalizeVariants(variants) {
  return (variants || []).map((v) => ({ ...v, id: v.id || randomUUID() }));
}

export async function listProducts(category) {
  const db = await getDb();
  const q = { is_active: true };
  if (category && category !== "all") q.category = category;
  return db
    .collection("products")
    .find(q, { projection: { _id: 0 } })
    .sort({ created_at: 1 })
    .limit(200)
    .toArray();
}

export async function getProductBySlug(slug) {
  const db = await getDb();
  return db.collection("products").findOne({ slug }, { projection: { _id: 0 } });
}

export async function createProduct(input) {
  const db = await getDb();
  const doc = {
    id: randomUUID(),
    slug: input.slug,
    name: input.name,
    category: input.category,
    short_description: input.short_description,
    description: input.description,
    image_url: input.image_url,
    gallery: input.gallery || [],
    variants: normalizeVariants(input.variants),
    highlights: input.highlights || [],
    is_active: input.is_active ?? true,
    created_at: nowIso(),
  };
  await db.collection("products").insertOne(doc);
  const { _id, ...out } = doc;
  return out;
}

export async function updateProduct(productId, input) {
  const db = await getDb();
  const existing = await db.collection("products").findOne({ id: productId }, { projection: { _id: 0 } });
  if (!existing) return null;
  const upd = {
    slug: input.slug,
    name: input.name,
    category: input.category,
    short_description: input.short_description,
    description: input.description,
    image_url: input.image_url,
    gallery: input.gallery || [],
    variants: normalizeVariants(input.variants),
    highlights: input.highlights || [],
    is_active: input.is_active ?? true,
  };
  await db.collection("products").updateOne({ id: productId }, { $set: upd });
  return db.collection("products").findOne({ id: productId }, { projection: { _id: 0 } });
}

export async function deleteProduct(productId) {
  const db = await getDb();
  const res = await db.collection("products").deleteOne({ id: productId });
  return res.deletedCount;
}
