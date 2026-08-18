import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { listProducts } from "@/lib/services/products";

export const runtime = "nodejs";

export const GET = withApi(async (request) => {
  const category = request.nextUrl.searchParams.get("category");
  const products = await listProducts(category);
  return NextResponse.json({ products });
});
