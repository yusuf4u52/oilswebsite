"use client";

import Image from "next/image";
import { inr } from "@/lib/utils";
import { Plus, Minus, Trash2 } from "lucide-react";

export default function OrderSummaryItems({ items, updateQty, removeItem }) {
  return (
    <div className="space-y-4 max-h-72 overflow-auto">
      {items.map((i) => (
        <div key={`${i.product_id}-${i.variant_id}`} className="flex gap-3">
          {i.image_url ? (
            <Image src={i.image_url} alt={i.name} width={56} height={64} className="w-14 h-16 object-cover rounded-lg bg-white"/>
          ) : (
            <div className="w-14 h-16 rounded-lg bg-white flex-shrink-0"/>
          )}
          <div className="flex-1 text-sm">
            <div className="font-medium">{i.name}</div>
            <div style={{ color: "var(--ink-2)" }}>{i.size}</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1 border rounded-full" style={{ borderColor: "var(--line)" }}>
                <button data-testid={`ck-dec-${i.variant_id}`} className="p-2" onClick={() => updateQty(i.product_id, i.variant_id, Math.max(0, i.qty - 1))}><Minus size={12}/></button>
                <span className="text-xs min-w-[14px] text-center">{i.qty}</span>
                <button data-testid={`ck-inc-${i.variant_id}`} className="p-2" onClick={() => updateQty(i.product_id, i.variant_id, i.qty + 1)}><Plus size={12}/></button>
              </div>
              <button data-testid={`ck-remove-${i.variant_id}`} onClick={() => removeItem(i.product_id, i.variant_id)} className="opacity-60 hover:opacity-100 p-2">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
          <div className="text-sm font-medium">{inr(i.price * i.qty)}</div>
        </div>
      ))}
    </div>
  );
}
