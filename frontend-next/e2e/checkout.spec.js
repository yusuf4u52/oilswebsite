const { test, expect } = require("@playwright/test");
const { trackConsoleErrors, seedCart, loginAsCustomer } = require("./utils");

test("guest checkout with a non-empty cart shows the sign-in gate, not a redirect", async ({ page }) => {
  // Regression test: the empty-cart redirect in CheckoutView used to fire
  // before CartContext finished hydrating from localStorage, bouncing a
  // guest with a real cart straight back to /shop. See context/CartContext.js
  // `hydrated` flag and components/views/CheckoutView.js's mount effect.
  const errors = trackConsoleErrors(page);

  await seedCart(page, [
    { product_id: "p1", variant_id: "v1", name: "Test Oil", size: "500ml", price: 280, qty: 1, image_url: "" },
  ]);

  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText("sign in to continue", { exact: false })).toBeVisible();

  expect(errors).toEqual([]);
});

test("checkout with an empty cart redirects to /shop", async ({ page }) => {
  await page.goto("/shop");
  await page.evaluate(() => localStorage.removeItem("cart_v1"));

  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/shop$/);
});

test("removing the last item from the cart during checkout redirects to /shop instead of showing a stale total", async ({ page }) => {
  // Regression test: CheckoutView's empty-cart redirect effect only depends
  // on `hydrated` (see the comment above it in CheckoutView.js), so it never
  // re-fires when `items` empties out after the page has already mounted.
  // Combined with computeDelivery() (lib/pricing.js) always charging
  // DELIVERY_FEE below the free-delivery threshold - including at subtotal
  // 0 - CheckoutSummaryPanel/MobileActionBar keep showing a ₹49 delivery fee
  // and total for a cart that now has nothing in it.
  // Requires a logged-in customer with a mobile number: CheckoutView only
  // renders the summary panel with its ck-remove-* controls once isCustomer
  // is true, otherwise it shows InlineLogin instead.
  await loginAsCustomer(page, "playwright-checkout-total@example.com", "Checkout Total Tester", "9876500002");
  await seedCart(page, [
    { product_id: "p1", variant_id: "v1", name: "Test Oil", size: "500ml", price: 280, qty: 1, image_url: "" },
  ]);
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/checkout$/);

  await page.click('[data-testid="ck-remove-v1"]');

  await expect(page).toHaveURL(/\/shop$/);
});
