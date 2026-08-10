import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { inr } from "@/lib/api";

export default function CartDrawer() {
  const { open, setOpen, items, updateQty, removeItem, subtotal, delivery, total } = useCart();
  const nav = useNavigate();

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
        data-testid="cart-overlay"
      />
      <aside
        data-testid="cart-drawer"
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "var(--bg)" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--line)" }}>
          <div>
            <div className="label">Your Bag</div>
            <div className="serif text-2xl">{items.length} {items.length === 1 ? "item" : "items"}</div>
          </div>
          <button data-testid="cart-close" onClick={() => setOpen(false)} className="p-2 hover:bg-black/5 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ maxHeight: "calc(100vh - 260px)" }}>
          {items.length === 0 && (
            <div className="text-center py-16">
              <div className="serif text-2xl mb-2">Your bag is empty</div>
              <p className="text-sm" style={{ color: "var(--ink-2)" }}>Add some liquid gold to it.</p>
              <button data-testid="cart-empty-shop" onClick={() => { setOpen(false); nav("/shop"); }} className="btn-primary mt-6">Browse Oils</button>
            </div>
          )}
          {items.map((i) => (
            <div key={`${i.product_id}-${i.variant_id}`} className="flex gap-4" data-testid={`cart-item-${i.variant_id}`}>
              <img src={i.image_url} alt={i.name} className="w-20 h-24 object-cover rounded-xl" style={{ background: "var(--bg-2)" }}/>
              <div className="flex-1">
                <div className="font-medium">{i.name}</div>
                <div className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>{i.size}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2 border rounded-full px-2 py-1" style={{ borderColor: "var(--line)" }}>
                    <button data-testid={`cart-dec-${i.variant_id}`} onClick={() => updateQty(i.product_id, i.variant_id, Math.max(0, i.qty - 1))}><Minus size={14}/></button>
                    <span className="text-sm min-w-[16px] text-center">{i.qty}</span>
                    <button data-testid={`cart-inc-${i.variant_id}`} onClick={() => updateQty(i.product_id, i.variant_id, i.qty + 1)}><Plus size={14}/></button>
                  </div>
                  <button data-testid={`cart-remove-${i.variant_id}`} onClick={() => removeItem(i.product_id, i.variant_id)} className="text-sm opacity-60 hover:opacity-100">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
              <div className="font-medium">{inr(i.price * i.qty)}</div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t p-6 space-y-3" style={{ borderColor: "var(--line)" }}>
            <div className="flex justify-between text-sm"><span style={{ color: "var(--ink-2)" }}>Subtotal</span><span>{inr(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: "var(--ink-2)" }}>Delivery</span><span>{delivery === 0 ? "FREE" : inr(delivery)}</span></div>
            <div className="flex justify-between text-lg font-semibold"><span>Total</span><span data-testid="cart-total">{inr(total)}</span></div>
            <button data-testid="cart-checkout" onClick={() => { setOpen(false); nav("/checkout"); }} className="btn-primary w-full justify-center">Checkout</button>
          </div>
        )}
      </aside>
    </>
  );
}
