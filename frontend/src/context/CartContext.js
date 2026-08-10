import { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);

const KEY = "cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + (item.qty || 1) };
        return copy;
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
    setOpen(true);
  };

  const updateQty = (product_id, variant_id, qty) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product_id === product_id && i.variant_id === variant_id
            ? { ...i, qty }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (product_id, variant_id) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product_id === product_id && i.variant_id === variant_id))
    );
  };

  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const delivery = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const total = subtotal + delivery;

  return (
    <CartCtx.Provider
      value={{ items, addItem, updateQty, removeItem, clear,
              subtotal, delivery, total, count,
              open, setOpen }}
    >
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
