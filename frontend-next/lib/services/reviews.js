import { randomUUID } from "crypto";
import { ApiError } from "@/lib/api-error";
import { getDb } from "@/lib/db/connect";
import { nowIso } from "@/lib/db/util";

function validateReviewInput(input) {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new ApiError(400, "Rating must be a whole number from 1 to 5");
  }
  if (typeof input.comment !== "string") {
    throw new ApiError(400, "Review text must be a string");
  }
  if (input.comment.length > 2000) {
    throw new ApiError(400, "Review must be under 2000 characters");
  }
}

export async function listReviewsForProduct(productId) {
  const db = await getDb();
  return db
    .collection("reviews")
    .find({ product_id: productId }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(200)
    .toArray();
}

export async function getRatingSummary(productId) {
  const db = await getDb();
  const [row] = await db
    .collection("reviews")
    .aggregate([
      { $match: { product_id: productId } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    .toArray();
  if (!row) return { average: 0, count: 0 };
  return { average: Math.round(row.average * 10) / 10, count: row.count };
}

export async function getReviewByUser(productId, userId) {
  const db = await getDb();
  return db.collection("reviews").findOne({ product_id: productId, user_id: userId }, { projection: { _id: 0 } });
}

// One review per user per product - resubmitting edits it in place rather than
// creating a duplicate, matching the "any logged-in user can review" gating.
export async function upsertReview({ productId, userId, userName, rating, comment }) {
  validateReviewInput({ rating, comment });
  const db = await getDb();
  const existing = await db.collection("reviews").findOne({ product_id: productId, user_id: userId });
  if (existing) {
    await db.collection("reviews").updateOne(
      { product_id: productId, user_id: userId },
      { $set: { rating, comment, user_name: userName, updated_at: nowIso() } }
    );
  } else {
    await db.collection("reviews").insertOne({
      id: randomUUID(),
      product_id: productId,
      user_id: userId,
      user_name: userName,
      rating,
      comment,
      created_at: nowIso(),
    });
  }
  return db.collection("reviews").findOne({ product_id: productId, user_id: userId }, { projection: { _id: 0 } });
}

export async function listRecentReviewsWithProduct() {
  const db = await getDb();
  return db
    .collection("reviews")
    .aggregate([
      { $sort: { created_at: -1 } },
      { $limit: 500 },
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "id",
          as: "product",
        },
      },
      {
        $addFields: {
          product_name: { $ifNull: [{ $first: "$product.name" }, "Deleted product"] },
          product_slug: { $first: "$product.slug" },
        },
      },
      { $project: { _id: 0, product: 0 } },
    ])
    .toArray();
}

export async function deleteReview(reviewId) {
  const db = await getDb();
  const res = await db.collection("reviews").deleteOne({ id: reviewId });
  return res.deletedCount;
}
