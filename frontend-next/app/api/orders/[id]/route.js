import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { getUserOrder } from "@/lib/services/orders";

export const runtime = "nodejs";

export const GET = withApi(async (request, { params }) => {
  const user = await getAuthUser(request);
  const { id } = await params;
  const order = await getUserOrder(user.id, id);
  if (!order) throw new ApiError(404, "Order not found");
  return NextResponse.json(order);
});
