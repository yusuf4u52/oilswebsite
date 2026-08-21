// Single source of truth for the delivery-fee rule — imported by both the
// client-side cart total (context/CartContext.js) and the server-side order
// total (lib/services/orders.js) so the two can never drift apart.
export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_FEE = 49;

export function computeDelivery(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}
