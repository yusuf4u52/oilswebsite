"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);

const KEY = "cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  // Reading localStorage during the useState initializer (the CRA version's
  // approach) crashes on the server. Read it here instead, once mounted.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {
      // ignore malformed cart data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Without this guard, this effect fires on mount with items=[] (before
    // the hydration effect above has committed its read) and overwrites a
    // real cart in localStorage with an empty one.
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

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
