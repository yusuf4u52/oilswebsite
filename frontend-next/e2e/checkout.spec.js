const { test, expect } = require("@playwright/test");
const { trackConsoleErrors, seedCart } = require("./utils");

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
