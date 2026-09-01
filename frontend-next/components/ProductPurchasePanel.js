"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { inr } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useProductVariant } from "@/context/ProductVariantContext";

export default function ProductPurchasePanel({ product: p }) {
  const { variant, setVariant } = useProductVariant();
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  const add = () => {
    addItem({
      product_id: p.id,
      variant_id: variant.id,
      name: p.name,
      size: variant.size,
      price: variant.price,
      qty,
      image_url: variant.image_url || p.image_url,
    });
    toast.success("Added to bag");
  };

  return (
    <>
      <div className="mt-8">
        <div className="label mb-3">Choose size</div>
        <div className="grid grid-cols-3 gap-3">
          {p.variants.map((v) => {
            const active = variant?.id === v.id;
            return (
              <button
                data-testid={`variant-${v.size}`}
                key={v.id}
                onClick={() => setVariant(v)}
                className={`text-left px-4 py-3 rounded-2xl border transition-colors ${active ? "border-[#1B4332] bg-[#1B4332]/5" : ""}`}
                style={{ borderColor: active ? "var(--brand)" : "var(--line)" }}
              >
                <div className="text-xl font-medium">{v.size}</div>
                <div className="text-sm mt-1">{inr(v.price)}</div>
                {v.mrp > v.price && <div className="text-xs line-through" style={{ color: "var(--ink-2)" }}>{inr(v.mrp)}</div>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div className="flex items-center gap-2 border rounded-full px-4 py-2" style={{ borderColor: "var(--line)" }}>
          <button data-testid="pd-qty-dec" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16}/></button>
          <span data-testid="pd-qty" className="min-w-[24px] text-center">{qty}</span>
          <button data-testid="pd-qty-inc" onClick={() => setQty(qty + 1)}><Plus size={16}/></button>
        </div>
        <button data-testid="pd-add-cart" onClick={add} className="btn-primary flex-1 justify-center">Add to Bag · {inr(variant.price * qty)}</button>
      </div>
    </>
  );
}
