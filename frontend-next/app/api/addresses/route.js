import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { getAuthUser } from "@/lib/auth/session";
import { listAddresses, createAddress } from "@/lib/services/addresses";

export const runtime = "nodejs";

export const GET = withApi(async (request) => {
  const user = await getAuthUser(request);
  const addresses = await listAddresses(user.id);
  return NextResponse.json({ addresses });
});

export const POST = withApi(async (request) => {
  const user = await getAuthUser(request);
  const data = await request.json();
  const addr = await createAddress(user.id, data);
  return NextResponse.json(addr);
});
