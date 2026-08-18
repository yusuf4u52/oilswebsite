import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { verifyOrderPayment } from "@/lib/services/orders";

export const runtime = "nodejs";

export const POST = withApi(async (request) => {
  const user = await getAuthUser(request);
  const data = await request.json();
  const result = await verifyOrderPayment(user, data);
  return NextResponse.json(result);
});
