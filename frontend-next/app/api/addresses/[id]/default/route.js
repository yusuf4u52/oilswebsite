import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { setDefaultAddress } from "@/lib/services/addresses";

export const runtime = "nodejs";

export const PUT = withApi(async (request, { params }) => {
  const user = await getAuthUser(request);
  const { id } = await params;
  const ok = await setDefaultAddress(user.id, id);
  if (!ok) throw new ApiError(404, "Address not found");
  return NextResponse.json({ ok: true });
});
