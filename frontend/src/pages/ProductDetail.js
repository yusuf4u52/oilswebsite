import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { inr } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { Check, Minus, Plus } from "lucide-react";

export default function ProductDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => {
      setP(r.data);
      setVariant(r.data.variants[0]);
    }).catch(() => toast.error("Product not found"));
  }, [slug]);

  if (!p) return <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">Loading…</div>;

  const add = () => {
    addItem({
      product_id: p.id,
      variant_id: variant.id,
      name: p.name,
      size: variant.size,
      price: variant.price,
      qty,
      image_url: p.image_url,
    });
    toast.success("Added to bag");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 fade-in">
      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-6">
          <div className="aspect-square rounded-[2rem] overflow-hidden" style={{ background: "var(--bg-2)" }}>
            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover"/>
          </div>
          {p.gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {p.gallery.map((g, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden" style={{ background: "var(--bg-2)" }}>
                  <img src={g} alt="" className="w-full h-full object-cover"/>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-6">
          <div className="label" style={{ color: "var(--amber)" }}>{p.category}</div>
          <h1 className="serif text-4xl sm:text-5xl mt-2 leading-tight">{p.name}</h1>
          <p className="mt-4 text-lg" style={{ color: "var(--ink-2)" }}>{p.short_description}</p>

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
                    <div className="serif text-xl">{v.size}</div>
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

          <div className="mt-8 divider"/>
          <div className="mt-8">
            <div className="label mb-3">Why you&apos;ll love it</div>
            <ul className="space-y-3">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-center gap-3"><Check size={16} style={{ color: "var(--brand)" }}/> {h}</li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <div className="label mb-3">About this oil</div>
            <p className="leading-relaxed" style={{ color: "var(--ink-2)" }}>{p.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
