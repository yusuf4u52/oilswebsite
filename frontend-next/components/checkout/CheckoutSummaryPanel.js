"use client";

import { inr } from "@/lib/utils";
import OrderSummaryItems from "./OrderSummaryItems";

export default function CheckoutSummaryPanel({ items, subtotal, delivery, total, updateQty, removeItem, ctaLabel, ctaDisabled, onCta }) {
  return (
    <div className="hidden md:block md:col-span-5">
      <div className="sticky top-24 border rounded-3xl p-6" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
        <div className="label">Order Summary</div>
        <div className="mt-4">
          <OrderSummaryItems items={items} updateQty={updateQty} removeItem={removeItem}/>
        </div>
        <div className="mt-6 pt-4 border-t space-y-2 text-sm" style={{ borderColor: "var(--line)" }}>
          <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Delivery</span><span>{delivery === 0 ? "FREE" : inr(delivery)}</span></div>
          <div className="flex justify-between text-lg font-semibold pt-2"><span>Total</span><span data-testid="ck-total">{inr(total)}</span></div>
        </div>
        <button data-testid="ck-place-order" onClick={onCta} disabled={ctaDisabled} className="btn-primary w-full justify-center mt-6">
          {ctaLabel}
        </button>
        <p className="text-xs text-center mt-3" style={{ color: "var(--ink-2)" }}>
          By placing this order you agree to our terms.
        </p>
      </div>
    </div>
  );
}
