import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { updateUserProfile } from "@/lib/services/auth";

export const runtime = "nodejs";

export const GET = withApi(async (request) => {
  const user = await getAuthUser(request);
  const { _id, ...userOut } = user;
  return NextResponse.json({ user: userOut });
});

export const PUT = withApi(async (request) => {
  const user = await getAuthUser(request);
  const data = await request.json();
  const updated = await updateUserProfile(user, data);
  return NextResponse.json({ user: updated });
});
