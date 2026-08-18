import { randomUUID } from "crypto";
import { getDb } from "@/lib/db/connect";

export async function listAddresses(userId) {
  const db = await getDb();
  return db.collection("addresses").find({ user_id: userId }, { projection: { _id: 0 } }).limit(50).toArray();
}

export async function createAddress(userId, input) {
  const db = await getDb();
  const addresses = db.collection("addresses");
  const addr = {
    id: randomUUID(),
    name: input.name,
    mobile: input.mobile,
    line1: input.line1,
    line2: input.line2 || "",
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    landmark: input.landmark || "",
    is_default: !!input.is_default,
    user_id: userId,
  };
  if (addr.is_default) {
    await addresses.updateMany({ user_id: userId }, { $set: { is_default: false } });
  }
  const count = await addresses.countDocuments({ user_id: userId });
  if (count === 0) addr.is_default = true;
  await addresses.insertOne(addr);
  const { _id, ...out } = addr;
  return out;
}

export async function deleteAddress(userId, addrId) {
  const db = await getDb();
  const res = await db.collection("addresses").deleteOne({ id: addrId, user_id: userId });
  return res.deletedCount;
}

// Returns false if the address doesn't exist / isn't owned by this user.
export async function setDefaultAddress(userId, addrId) {
  const db = await getDb();
  const addresses = db.collection("addresses");
  const addr = await addresses.findOne({ id: addrId, user_id: userId });
  if (!addr) return false;
  await addresses.updateMany({ user_id: userId }, { $set: { is_default: false } });
  await addresses.updateOne({ id: addrId, user_id: userId }, { $set: { is_default: true } });
  return true;
}
