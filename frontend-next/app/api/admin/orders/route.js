import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { listAllOrdersAdmin } from "@/lib/services/orders";

export const runtime = "nodejs";

export const GET = withApi(async (request) => {
  await requireAdmin(request);
  const orders = await listAllOrdersAdmin();
  return NextResponse.json({ orders });
});
