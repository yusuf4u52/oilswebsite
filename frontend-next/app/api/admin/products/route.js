import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { createProduct } from "@/lib/services/products";

export const runtime = "nodejs";

export const POST = withApi(async (request) => {
  await requireAdmin(request);
  const data = await request.json();
  const doc = await createProduct(data);
  return NextResponse.json(doc);
});
