import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { getProductBySlug } from "@/lib/services/products";
import { listReviewsForProduct, getRatingSummary, upsertReview } from "@/lib/services/reviews";

export const runtime = "nodejs";

export const GET = withApi(async (request, { params }) => {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) throw new ApiError(404, "Product not found");
  const [reviews, summary] = await Promise.all([
    listReviewsForProduct(product.id),
    getRatingSummary(product.id),
  ]);
  return NextResponse.json({ reviews, summary });
});

export const POST = withApi(async (request, { params }) => {
  const { slug } = await params;
  const user = await getAuthUser(request);
  if (user.role === "admin") throw new ApiError(403, "Log in as a customer to write a review");
  const product = await getProductBySlug(slug);
  if (!product) throw new ApiError(404, "Product not found");
  const data = await request.json();
  const review = await upsertReview({
    productId: product.id,
    userId: user.id,
    userName: user.name || "Verified customer",
    rating: data.rating,
    comment: (data.comment || "").trim(),
  });
  return NextResponse.json(review);
});
