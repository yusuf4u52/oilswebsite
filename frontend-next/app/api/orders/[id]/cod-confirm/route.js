import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { confirmCod } from "@/lib/services/orders";

export const runtime = "nodejs";

export const POST = withApi(async (request, { params }) => {
  const user = await getAuthUser(request);
  const { id } = await params;
  const result = await confirmCod(user, id);
  return NextResponse.json(result);
});
