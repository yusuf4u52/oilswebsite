import { randomUUID } from "crypto";
import { ApiError } from "@/lib/api-error";
import { getDb } from "@/lib/db/connect";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/lib/config/env";

function nowIso() {
  return new Date().toISOString();
}

export function verifyAdminCredentials(email, password) {
  // Plain-text env-var compare, matching backend/server.py exactly (a pre-existing
  // gap, not something this migration changes — see plan notes).
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    throw new ApiError(401, "Invalid admin credentials");
  }
  return { id: "admin", role: "admin", email: ADMIN_EMAIL };
}

export async function upsertGoogleUser({ googleId, email, name, picture }) {
  const db = await getDb();
  const users = db.collection("users");
  let user = await users.findOne({ google_id: googleId }, { projection: { _id: 0 } });
  if (!user) {
    user = {
      id: randomUUID(),
      google_id: googleId,
      email,
      name,
      picture,
      created_at: nowIso(),
    };
    await users.insertOne(user);
  } else {
    await users.updateOne({ id: user.id }, { $set: { email, name, picture } });
    user = { ...user, email, name, picture };
  }
  return user;
}

export async function updateUserProfile(user, patch) {
  if (user.role === "admin") throw new ApiError(400, "Not applicable");
  const upd = {};
  if (patch.name !== undefined && patch.name !== null) upd.name = patch.name;
  if (patch.mobile !== undefined && patch.mobile !== null) upd.mobile = patch.mobile;
  if ("mobile" in upd && !(/^\d{10}$/.test(upd.mobile))) {
    throw new ApiError(400, "Enter a valid 10-digit mobile number");
  }
  const db = await getDb();
  if (Object.keys(upd).length) {
    try {
      await db.collection("users").updateOne({ id: user.id }, { $set: upd });
    } catch (err) {
      if (err?.code === 11000) {
        throw new ApiError(400, "This mobile number is already linked to another account");
      }
      throw err;
    }
  }
  return db.collection("users").findOne({ id: user.id }, { projection: { _id: 0 } });
}

export async function listUsersWithStats() {
  const db = await getDb();
  const users = await db
    .collection("users")
    .find({}, { projection: { _id: 0, google_id: 0 } })
    .sort({ created_at: -1 })
    .limit(1000)
    .toArray();

  const pipeline = [
    { $match: { payment_status: { $in: ["paid", "cod_pending"] } } },
    { $group: { _id: "$user_id", order_count: { $sum: 1 }, total_spent: { $sum: "$total" } } },
  ];
  const statsByUser = {};
  for await (const r of db.collection("orders").aggregate(pipeline)) {
    statsByUser[r._id] = { order_count: r.order_count, total_spent: Math.round(r.total_spent * 100) / 100 };
  }
  for (const u of users) {
    const s = statsByUser[u.id] || { order_count: 0, total_spent: 0 };
    u.order_count = s.order_count;
    u.total_spent = s.total_spent;
  }
  return users;
}
