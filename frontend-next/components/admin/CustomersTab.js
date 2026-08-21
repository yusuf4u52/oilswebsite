"use client";

import { inr } from "@/lib/utils";

export default function CustomersTab({ customers }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left label" style={{ color: "var(--ink-2)" }}>
            <th className="py-3">Customer</th><th>Contact</th><th>Joined</th><th>Orders</th><th>Total Spent</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && (
            <tr><td colSpan={5} className="py-10 text-center" style={{ color: "var(--ink-2)" }}>No customers yet.</td></tr>
          )}
          {customers.map((c) => (
            <tr key={c.id} className="border-t" style={{ borderColor: "var(--line)" }} data-testid={`admin-customer-${c.id}`}>
              <td className="py-3">
                <div>{c.name || "—"}</div>
              </td>
              <td>
                <div className="text-xs">{c.email || "—"}</div>
                <div className="text-xs" style={{ color: "var(--ink-2)" }}>{c.mobile ? `+91 ${c.mobile}` : ""}</div>
              </td>
              <td className="text-xs" style={{ color: "var(--ink-2)" }}>{c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "—"}</td>
              <td>{c.order_count ?? 0}</td>
              <td className="font-medium">{inr(c.total_spent ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
