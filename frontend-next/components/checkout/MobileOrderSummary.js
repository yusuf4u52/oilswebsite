"use client";

import { ChevronDown } from "lucide-react";
import { inr } from "@/lib/utils";
import OrderSummaryItems from "./OrderSummaryItems";

export default function MobileOrderSummary({ items, subtotal, delivery, total, updateQty, removeItem, open, onToggle }) {
  return (
    <div className="md:hidden mt-6">
      <button
        data-testid="ck-summary-toggle"
        onClick={onToggle}
        className="w-full flex items-center justify-between border rounded-2xl px-5 py-4"
        style={{ borderColor: "var(--line)" }}
      >
        <span className="text-sm font-medium">Order summary · {items.length} {items.length === 1 ? "item" : "items"}</span>
        <span className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-2)" }}>
          {inr(total)}
          <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }}/>
        </span>
      </button>
      {open && (
        <div className="border border-t-0 rounded-b-2xl px-5 py-5" style={{ borderColor: "var(--line)" }}>
          <OrderSummaryItems items={items} updateQty={updateQty} removeItem={removeItem}/>
          <div className="mt-4 pt-4 border-t space-y-2 text-sm" style={{ borderColor: "var(--line)" }}>
            <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Subtotal</span><span>{inr(subtotal)}</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Delivery</span><span>{delivery === 0 ? "FREE" : inr(delivery)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-1"><span>Total</span><span>{inr(total)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
