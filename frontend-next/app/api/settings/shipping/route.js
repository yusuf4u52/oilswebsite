import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { getShippingSettings } from "@/lib/services/settings";

export const runtime = "nodejs";
// Read on every request - the cart must reflect an admin's change immediately.
export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const settings = await getShippingSettings();
  return NextResponse.json(settings);
});
