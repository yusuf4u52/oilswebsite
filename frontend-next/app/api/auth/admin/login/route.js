import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { makeToken } from "@/lib/auth/jwt";
import { verifyAdminCredentials } from "@/lib/services/auth";
import { ADMIN_EMAIL } from "@/lib/config/env";

export const runtime = "nodejs";

export const POST = withApi(async (request) => {
  const data = await request.json();
  const user = verifyAdminCredentials(data.email, data.password);
  const token = makeToken({ sub: "admin", role: "admin", email: ADMIN_EMAIL });
  return NextResponse.json({ token, user });
});
