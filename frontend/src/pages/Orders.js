import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { inr } from "@/lib/api";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data.orders)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-14">
      <div className="label">Your Orders</div>
      <h1 className="serif text-5xl mt-2">Every drop, tracked.</h1>

      {loading && <div className="mt-10">Loading…</div>}
      {!loading && orders.length === 0 && (
        <div className="mt-16 text-center">
          <div className="serif text-2xl">No orders yet.</div>
          <p className="text-sm mt-2" style={{ color: "var(--ink-2)" }}>Your future orders will appear here.</p>
          <Link data-testid="orders-shop-btn" to="/shop" className="btn-primary mt-6 inline-flex">Start shopping</Link>
        </div>
      )}

      <div className="mt-10 space-y-5">
        {orders.map((o) => (
          <div key={o.id} data-testid={`order-${o.id}`} className="border rounded-2xl p-6" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="label">Order · {o.id.slice(0, 8)}</div>
                <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>{new Date(o.created_at).toLocaleString("en-IN")}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[o.status] || ""}`}>{o.status}</span>
                <div className="serif text-xl">{inr(o.total)}</div>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {o.items.map((i, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <img src={i.image_url} alt={i.name} className="w-14 h-16 object-cover rounded-lg" style={{ background: "var(--bg-2)" }}/>
                  <div className="text-sm">
                    <div className="font-medium">{i.name}</div>
                    <div style={{ color: "var(--ink-2)" }}>{i.size} · Qty {i.qty} · {inr(i.price)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs" style={{ color: "var(--ink-2)" }}>
              Delivering to {o.address.name}, {o.address.city} — {o.address.pincode} · {o.payment_method === "cod" ? "COD" : "Prepaid"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
