import { ApiError } from "@/lib/api-error";
import { getDb } from "@/lib/db/connect";
import { nowIso } from "@/lib/db/util";
import { DEFAULT_SHIPPING } from "@/lib/pricing";

const SHIPPING_ID = "shipping";

export async function getShippingSettings() {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ id: SHIPPING_ID }, { projection: { _id: 0 } });
  if (!doc) return { ...DEFAULT_SHIPPING };
  return {
    delivery_fee: doc.delivery_fee ?? DEFAULT_SHIPPING.delivery_fee,
    free_delivery_threshold: doc.free_delivery_threshold === undefined
      ? DEFAULT_SHIPPING.free_delivery_threshold
      : doc.free_delivery_threshold,
  };
}

function isNonNegativeAmount(n) {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

export async function updateShippingSettings(data) {
  const deliveryFee = data?.delivery_fee;
  const threshold = data?.free_delivery_threshold ?? null;
  if (!isNonNegativeAmount(deliveryFee)) {
    throw new ApiError(400, "Delivery fee must be a number of 0 or more");
  }
  if (threshold !== null && !isNonNegativeAmount(threshold)) {
    throw new ApiError(400, "Free-delivery threshold must be a number of 0 or more, or empty");
  }
  const settings = { delivery_fee: deliveryFee, free_delivery_threshold: threshold };
  const db = await getDb();
  await db.collection("settings").updateOne(
    { id: SHIPPING_ID },
    { $set: { ...settings, id: SHIPPING_ID, updated_at: nowIso() } },
    { upsert: true }
  );
  return settings;
}
