import { MSG91_AUTH_KEY, ORDER_STATUS_TEMPLATES } from "@/lib/config/env";

async function msg91Send(mobile, templateId, variables) {
  if (!MSG91_AUTH_KEY || !templateId) return false;
  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: MSG91_AUTH_KEY, accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        template_id: templateId,
        short_url: "0",
        recipients: [{ mobiles: `91${mobile}`, ...variables }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.type === "success") return true;
    console.error(`MSG91 send failed: status=${res.status} body=${JSON.stringify(body)}`);
    return false;
  } catch (err) {
    console.error("MSG91 request failed", err);
    return false;
  }
}

// Best-effort order notification - never blocks or fails the order flow.
export async function sendOrderStatusSms(mobile, orderId, status) {
  const templateId = ORDER_STATUS_TEMPLATES[status];
  if (!mobile || !templateId) return;
  const ok = await msg91Send(mobile, templateId, { ORDER_ID: orderId.slice(0, 8) });
  if (!ok) console.error(`Order status SMS failed: order=${orderId} status=${status} mobile=${mobile}`);
}
