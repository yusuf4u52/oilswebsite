import { randomUUID } from "crypto";
import { ApiError } from "@/lib/api-error";
import { getDb } from "@/lib/db/connect";
import { nowIso, stripId } from "@/lib/db/util";
import { computeDelivery } from "@/lib/pricing";
import { RAZORPAY_MODE, RAZORPAY_KEY_ID } from "@/lib/config/env";
import { createRazorpayOrder, verifyPaymentSignature } from "@/lib/integrations/razorpay";
import { sendOrderStatusSms } from "@/lib/integrations/sms";
import { sendOrderConfirmationEmail, sendOrderStatusEmail, sendAdminNewOrderEmail } from "@/lib/integrations/email";

// Prices/names/images must come from the stored product, never from the
// client - a request body only supplies product_id/variant_id/qty. Trusting
// client-supplied prices lets an attacker set their own total (including for
// the real Razorpay charge and for COD orders, which have no other checkpoint).
async function resolveOrderItems(db, rawItems) {
  const items = [];
  for (const raw of rawItems) {
    const qty = raw.qty;
    if (!Number.isInteger(qty) || qty < 1) {
      throw new ApiError(400, "Invalid item quantity");
    }
    const product = await db
      .collection("products")
      .findOne({ id: raw.product_id, is_active: true }, { projection: { _id: 0 } });
    if (!product) throw new ApiError(400, "Product not found");
    const variant = (product.variants || []).find((v) => v.id === raw.variant_id);
    if (!variant) throw new ApiError(400, "Product variant not found");
    items.push({
      product_id: product.id,
      variant_id: variant.id,
      name: product.name,
      size: variant.size,
      price: variant.price,
      qty,
      image_url: product.image_url,
    });
  }
  return items;
}

export function computeTotals(items) {
  const subtotalRaw = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const delivery = computeDelivery(subtotalRaw);
  const subtotal = Math.round(subtotalRaw * 100) / 100;
  const total = Math.round((subtotal + delivery) * 100) / 100;
  return { subtotal, delivery, total };
}

async function fireOrderConfirmedNotifications(order) {
  await sendOrderStatusSms(order.user_mobile || "", order.id, "confirmed");
  await sendOrderConfirmationEmail(order);
  await sendAdminNewOrderEmail(order);
}

export async function createOrder(user, input) {
  if (!input.items?.length) throw new ApiError(400, "Cart is empty");
  const db = await getDb();
  const address = await db
    .collection("addresses")
    .findOne({ id: input.address_id, user_id: user.id }, { projection: { _id: 0 } });
  if (!address) throw new ApiError(400, "Address not found");

  const items = await resolveOrderItems(db, input.items);
  const { subtotal, delivery, total } = computeTotals(items);
  const amountPaise = Math.round(total * 100);
  const paymentMethod = input.payment_method || "razorpay";
  if (paymentMethod === "razorpay" && amountPaise < 100) {
    throw new ApiError(400, "Order amount must be at least ₹1 for online payment");
  }

  const orderId = randomUUID();
  let razorpayOrderId = null;
  if (paymentMethod === "razorpay") {
    razorpayOrderId = await createRazorpayOrder(amountPaise, orderId);
  }

  const doc = {
    id: orderId,
    user_id: user.id,
    user_mobile: user.mobile || "",
    user_email: user.email || "",
    items,
    address,
    payment_method: paymentMethod,
    payment_status: "pending",
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: null,
    subtotal,
    delivery_fee: delivery,
    total,
    status: "pending",
    created_at: nowIso(),
  };
  await db.collection("orders").insertOne(doc);
  return {
    order: stripId(doc),
    razorpay_key_id: RAZORPAY_MODE === "live" ? RAZORPAY_KEY_ID : "rzp_test_mock",
    razorpay_mode: RAZORPAY_MODE,
  };
}

export async function verifyOrderPayment(user, data) {
  const db = await getDb();
  const orders = db.collection("orders");
  const order = await orders.findOne({ id: data.order_id, user_id: user.id }, { projection: { _id: 0 } });
  if (!order) throw new ApiError(404, "Order not found");

  const ok = verifyPaymentSignature(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);
  if (!ok) throw new ApiError(400, "Payment signature verification failed");

  const result = await orders.updateOne(
    { id: data.order_id, payment_status: { $ne: "paid" } },
    {
      $set: {
        payment_status: "paid",
        status: "confirmed",
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        paid_at: nowIso(),
      },
    }
  );
  if (result.modifiedCount) await fireOrderConfirmedNotifications(order);
  return { ok: true };
}

// event: "payment.captured" | "payment.failed" | other. entity: payload.payment.entity from Razorpay.
export async function applyRazorpayWebhookEvent(event, entity) {
  const razorpayOrderId = entity?.order_id;
  if (!razorpayOrderId) return { ok: true };
  const db = await getDb();
  const orders = db.collection("orders");

  if (event === "payment.captured") {
    const updated = await orders.findOneAndUpdate(
      { razorpay_order_id: razorpayOrderId, payment_status: { $ne: "paid" } },
      {
        $set: {
          payment_status: "paid",
          status: "confirmed",
          razorpay_payment_id: entity.id,
          paid_at: nowIso(),
        },
      }
    );
    if (updated) await fireOrderConfirmedNotifications(updated);
  } else if (event === "payment.failed") {
    await orders.updateOne(
      { razorpay_order_id: razorpayOrderId, payment_status: { $ne: "paid" } },
      { $set: { payment_status: "failed" } }
    );
  }
  return { ok: true };
}

export async function confirmCod(user, orderId) {
  const db = await getDb();
  const orders = db.collection("orders");
  const order = await orders.findOne({ id: orderId, user_id: user.id }, { projection: { _id: 0 } });
  if (!order) throw new ApiError(404, "Order not found");
  const result = await orders.updateOne(
    { id: orderId, status: { $ne: "confirmed" } },
    { $set: { status: "confirmed", payment_status: "cod_pending" } }
  );
  if (result.modifiedCount) await fireOrderConfirmedNotifications(order);
  return { ok: true };
}

export async function listUserOrders(userId) {
  const db = await getDb();
  return db
    .collection("orders")
    .find({ user_id: userId }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(200)
    .toArray();
}

export async function getUserOrder(userId, orderId) {
  const db = await getDb();
  return db.collection("orders").findOne({ id: orderId, user_id: userId }, { projection: { _id: 0 } });
}

export async function listAllOrdersAdmin() {
  const db = await getDb();
  return db.collection("orders").find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(500).toArray();
}

export async function deleteOrderAdmin(orderId) {
  const db = await getDb();
  const orders = db.collection("orders");
  const order = await orders.findOne({ id: orderId }, { projection: { _id: 0 } });
  if (!order) throw new ApiError(404, "Order not found");
  const isUnpaid = order.payment_method === "razorpay" && order.payment_status !== "paid";
  if (!isUnpaid) {
    throw new ApiError(400, "Only unpaid orders can be deleted");
  }
  const res = await orders.deleteOne({ id: orderId });
  return res.deletedCount;
}

const ALLOWED_STATUSES = new Set(["pending", "confirmed", "shipped", "delivered", "cancelled"]);

export async function updateOrderStatusAdmin(orderId, status) {
  if (!ALLOWED_STATUSES.has(status)) throw new ApiError(400, "Invalid status");
  const db = await getDb();
  const orders = db.collection("orders");
  const order = await orders.findOne({ id: orderId }, { projection: { _id: 0 } });
  if (!order) throw new ApiError(404, "Order not found");
  if (["confirmed", "shipped", "delivered"].includes(status) && !["paid", "cod_pending"].includes(order.payment_status)) {
    throw new ApiError(400, "Cannot set this status until payment is completed");
  }
  const updated = await orders.findOneAndUpdate({ id: orderId, status: { $ne: status } }, { $set: { status } });
  if (updated) {
    await sendOrderStatusSms(updated.user_mobile || "", orderId, status);
    if (status === "confirmed") {
      await sendOrderConfirmationEmail(updated);
      await sendAdminNewOrderEmail(updated);
    } else {
      await sendOrderStatusEmail(updated, status);
    }
  }
  return { ok: true };
}
