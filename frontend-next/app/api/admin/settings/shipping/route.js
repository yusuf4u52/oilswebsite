import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { updateShippingSettings } from "@/lib/services/settings";

export const runtime = "nodejs";

export const PUT = withApi(async (request) => {
  await requireAdmin(request);
  const data = await request.json();
  const settings = await updateShippingSettings(data);
  return NextResponse.json(settings);
});
