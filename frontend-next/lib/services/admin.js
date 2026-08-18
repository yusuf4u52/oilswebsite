import { getDb } from "@/lib/db/connect";

export async function getAdminStats() {
  const db = await getDb();
  const orders = db.collection("orders");
  const [totalOrders, paidOrders, pendingOrders, users, products] = await Promise.all([
    orders.countDocuments({}),
    orders.countDocuments({ payment_status: "paid" }),
    orders.countDocuments({ status: "pending" }),
    db.collection("users").countDocuments({}),
    db.collection("products").countDocuments({}),
  ]);

  const pipeline = [
    { $match: { payment_status: { $in: ["paid", "cod_pending"] } } },
    { $group: { _id: null, revenue: { $sum: "$total" } } },
  ];
  let revenue = 0;
  for await (const r of orders.aggregate(pipeline)) {
    revenue = r.revenue || 0;
  }

  return {
    total_orders: totalOrders,
    paid_orders: paidOrders,
    pending_orders: pendingOrders,
    users,
    products,
    revenue: Math.round(revenue * 100) / 100,
  };
}
