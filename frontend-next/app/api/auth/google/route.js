import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { makeToken } from "@/lib/auth/jwt";
import { resolveGoogleCredential } from "@/lib/integrations/google";
import { upsertGoogleUser } from "@/lib/services/auth";
import { stripId } from "@/lib/db/util";

export const runtime = "nodejs";

export const POST = withApi(async (request) => {
  const data = await request.json();
  const profile = await resolveGoogleCredential(data.credential);
  const user = await upsertGoogleUser(profile);
  const token = makeToken({ sub: user.id, role: "user" });
  return NextResponse.json({ token, user: stripId(user), needs_mobile: !user.mobile });
});
