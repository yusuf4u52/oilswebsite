"use client";

import { Trash2 } from "lucide-react";
import { inr } from "@/lib/utils";

const PAYMENT_COLORS = { paid: "#1B7A43", cod_pending: "#B7791F", failed: "#C0392B" };

export default function OrdersTab({ orders, onChangeStatus, onDelete }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left label" style={{ color: "var(--ink-2)" }}>
            <th className="py-3">Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr><td colSpan={7} className="py-10 text-center" style={{ color: "var(--ink-2)" }}>No orders yet.</td></tr>
          )}
          {orders.map((o) => {
            const isUnpaid = o.payment_method === "razorpay" && o.payment_status !== "paid";
            const statusOptions = isUnpaid
              ? ["pending", "cancelled"]
              : ["pending", "confirmed", "shipped", "delivered", "cancelled"];
            return (
              <tr key={o.id} className="border-t" style={{ borderColor: "var(--line)" }} data-testid={`admin-order-${o.id}`}>
                <td className="py-3">
                  <div className="font-mono text-xs">{o.id.slice(0, 8)}</div>
                  <div className="text-xs" style={{ color: "var(--ink-2)" }}>{new Date(o.created_at).toLocaleDateString("en-IN")}</div>
                </td>
                <td>
                  <div>{o.address.name}</div>
                  <div className="text-xs" style={{ color: "var(--ink-2)" }}>+91 {o.address.mobile}</div>
                </td>
                <td>
                  <div className="space-y-0.5">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="text-xs whitespace-nowrap">
                        {i.name}{i.size ? ` (${i.size})` : ""} × {i.qty}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="font-medium">{inr(o.total)}</td>
                <td className="text-xs">
                  <div>{o.payment_method}</div>
                  <div style={{ color: PAYMENT_COLORS[o.payment_status] || "var(--ink-2)", fontWeight: isUnpaid ? 600 : 400 }}>
                    {isUnpaid ? "unpaid" : o.payment_status}
                  </div>
                </td>
                <td>
                  <select
                    data-testid={`admin-order-status-${o.id}`}
                    value={o.status}
                    onChange={(e) => onChangeStatus(o.id, e.target.value)}
                    className="input !py-1 !px-2 text-xs"
                  >
                    {statusOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  {isUnpaid && (
                    <button
                      data-testid={`admin-order-delete-${o.id}`}
                      onClick={() => onDelete(o.id)}
                      className="btn-ghost !py-1 !px-2"
                      aria-label="Delete order"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
