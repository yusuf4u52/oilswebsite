import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api-error";
import { getProductBySlug } from "@/lib/services/products";

export const runtime = "nodejs";

export const GET = withApi(async (request, { params }) => {
  const { slug } = await params;
  const doc = await getProductBySlug(slug);
  if (!doc) throw new ApiError(404, "Product not found");
  return NextResponse.json(doc);
});
