import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/services/admin";

export const runtime = "nodejs";

export const GET = withApi(async (request) => {
  await requireAdmin(request);
  const stats = await getAdminStats();
  return NextResponse.json(stats);
});
