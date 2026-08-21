"use client";

import Image from "next/image";
import { inr } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function OrderConfirmation({ order, onViewOrders, onContinueShopping }) {
  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-20 text-center fade-in">
      <CheckCircle2 size={56} style={{ color: "var(--brand)" }} className="mx-auto"/>
      <div className="label mt-6">Order Confirmed</div>
      <h1 className="serif text-5xl mt-2">Thank you!</h1>
      <p className="mt-4 text-lg" style={{ color: "var(--ink-2)" }}>
        Order <b data-testid="ck-confirmed-order-id">#{order.id.slice(0, 8)}</b> is on its way. We&apos;ll deliver your liquid gold soon.
      </p>
      <div className="mt-8 border rounded-3xl p-6 text-left" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
        <div className="space-y-4 max-h-60 overflow-auto">
          {order._items.map((i) => (
            <div key={`${i.product_id}-${i.variant_id}`} className="flex gap-3">
              {i.image_url ? (
                <Image src={i.image_url} alt={i.name} width={56} height={64} className="w-14 h-16 object-cover rounded-lg bg-white"/>
              ) : (
                <div className="w-14 h-16 rounded-lg bg-white flex-shrink-0"/>
              )}
              <div className="flex-1 text-sm">
                <div className="font-medium">{i.name}</div>
                <div style={{ color: "var(--ink-2)" }}>{i.size} · Qty {i.qty}</div>
              </div>
              <div className="text-sm font-medium">{inr(i.price * i.qty)}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between text-lg font-semibold" style={{ borderColor: "var(--line)" }}>
          <span>Total</span><span>{inr(order._total)}</span>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <button data-testid="ck-confirmed-view-orders" onClick={onViewOrders} className="btn-primary">View My Orders</button>
        <button data-testid="ck-confirmed-continue-shopping" onClick={onContinueShopping} className="btn-ghost">Continue Shopping</button>
      </div>
    </div>
  );
}
