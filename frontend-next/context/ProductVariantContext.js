"use client";

import { createContext, useContext, useState } from "react";

const Ctx = createContext(null);

// Shared between the main product image and ProductPurchasePanel so picking
// a size swaps the displayed (and later, added-to-cart) image without
// lifting the whole product detail page into one client component.
export function ProductVariantProvider({ product, children }) {
  const [variant, setVariant] = useState(product.variants[0]);
  return (
    <Ctx.Provider value={{ variant, setVariant }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProductVariant() {
  return useContext(Ctx);
}
