import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { listUsersWithStats } from "@/lib/services/auth";

export const runtime = "nodejs";

export const GET = withApi(async (request) => {
  await requireAdmin(request);
  const users = await listUsersWithStats();
  return NextResponse.json({ users });
});
