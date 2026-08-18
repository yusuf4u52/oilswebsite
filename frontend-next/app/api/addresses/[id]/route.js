import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { deleteAddress } from "@/lib/services/addresses";

export const runtime = "nodejs";

export const DELETE = withApi(async (request, { params }) => {
  const user = await getAuthUser(request);
  const { id } = await params;
  const deleted = await deleteAddress(user.id, id);
  return NextResponse.json({ deleted });
});
