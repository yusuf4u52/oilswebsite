import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { updateProduct, deleteProduct } from "@/lib/services/products";

export const runtime = "nodejs";

export const PUT = withApi(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const data = await request.json();
  const updated = await updateProduct(id, data);
  if (!updated) throw new ApiError(404, "Product not found");
  return NextResponse.json(updated);
});

export const DELETE = withApi(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const deleted = await deleteProduct(id);
  return NextResponse.json({ deleted });
});
