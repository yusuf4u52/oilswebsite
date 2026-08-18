import crypto from "crypto";
import Razorpay from "razorpay";
import { ApiError } from "@/lib/api-error";
import { RAZORPAY_MODE, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } from "@/lib/config/env";

// Constant-time compare that, unlike Node's crypto.timingSafeEqual, tolerates a
// length mismatch by returning false instead of throwing (matches Python's
// hmac.compare_digest, which never throws).
function safeEqual(expectedHex, actualHex) {
  if (!actualHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(String(actualHex), "hex");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

// Live: creates a real Razorpay order. Mock: returns a fake order_mock_ id.
// Mirrors backend/server.py's create_order Razorpay branch, including its exact
// error-status mapping.
export async function createRazorpayOrder(amountPaise, receipt) {
  if (RAZORPAY_MODE === "live" && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    const instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    try {
      const rzOrder = await instance.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: receipt.slice(0, 40),
        payment_capture: 1,
      });
      return rzOrder.id;
    } catch (err) {
      const msg = err?.error?.description || err?.message || String(err);
      if (/auth|key/i.test(msg)) throw new ApiError(401, "Razorpay authentication failed");
      throw new ApiError(500, `Razorpay order creation failed: ${msg}`);
    }
  }
  return `order_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}

export function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature) {
  if (!(RAZORPAY_MODE === "live" && RAZORPAY_KEY_SECRET)) return true;
  const message = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(message).digest("hex");
  return safeEqual(expected, signature);
}

// Returns true if the webhook secret isn't configured (matches server.py, which
// only enforces the check when RAZORPAY_WEBHOOK_SECRET is set).
export function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!RAZORPAY_WEBHOOK_SECRET) return true;
  const expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqual(expected, signatureHeader);
}
