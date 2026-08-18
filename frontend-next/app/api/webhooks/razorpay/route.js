import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api-error";
import { verifyWebhookSignature } from "@/lib/integrations/razorpay";
import { applyRazorpayWebhookEvent } from "@/lib/services/orders";

export const runtime = "nodejs";

export const POST = withApi(async (request) => {
  // Must read the raw body FIRST, before any JSON parsing - a Request body stream
  // can only be consumed once, and the HMAC signature is computed over the exact
  // raw bytes, not a re-serialized version of the parsed JSON.
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(rawBody, signatureHeader)) {
    throw new ApiError(400, "Invalid webhook signature");
  }
  const payload = JSON.parse(rawBody);
  const event = payload.event;
  const entity = payload?.payload?.payment?.entity || {};
  const result = await applyRazorpayWebhookEvent(event, entity);
  return NextResponse.json(result);
});
