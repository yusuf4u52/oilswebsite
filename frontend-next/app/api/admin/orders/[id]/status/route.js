import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { updateOrderStatusAdmin } from "@/lib/services/orders";

export const runtime = "nodejs";

export const PUT = withApi(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const data = await request.json();
  const result = await updateOrderStatusAdmin(id, data.status);
  return NextResponse.json(result);
});
