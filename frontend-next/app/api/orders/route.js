import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { createOrder, listUserOrders } from "@/lib/services/orders";

export const runtime = "nodejs";

export const GET = withApi(async (request) => {
  const user = await getAuthUser(request);
  const orders = await listUserOrders(user.id);
  return NextResponse.json({ orders });
});

export const POST = withApi(async (request) => {
  const user = await getAuthUser(request);
  const data = await request.json();
  const result = await createOrder(user, data);
  return NextResponse.json(result);
});
