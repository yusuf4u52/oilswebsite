// Single source of truth for the delivery-fee rule — imported by both the
// client-side cart total (context/CartContext.js) and the server-side order
// total (lib/services/orders.js) so the two can never drift apart. The actual
// fee/threshold are admin-configurable (lib/services/settings.js); these are
// only the fallback used until an admin saves something.
export const DEFAULT_SHIPPING = { delivery_fee: 49, free_delivery_threshold: 499 };

// A null threshold means free delivery is switched off - every order pays the fee.
export function computeDelivery(subtotal, shipping = DEFAULT_SHIPPING) {
  const { delivery_fee, free_delivery_threshold } = shipping;
  if (free_delivery_threshold != null && subtotal >= free_delivery_threshold) return 0;
  return delivery_fee;
}
