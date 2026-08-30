const { test, expect } = require("@playwright/test");
const {
  trackConsoleErrors,
  seedCart,
  loginAsCustomer,
  currentUserId,
  insertOrder,
  deleteOrderById,
  findOrdersByUser,
  closeDb,
} = require("./utils");

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

test.describe("retrying checkout after an abandoned payment", () => {
  let userId;
  let addressId;
  let token;

  test.afterEach(async ({ page }) => {
    if (addressId && token) {
      await page.request.delete(`/api/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    if (userId) {
      const orders = await findOrdersByUser(userId);
      await Promise.all(orders.map((o) => deleteOrderById(o.id)));
    }
    userId = null;
    addressId = null;
    token = null;
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("reuses the existing pending order instead of creating a duplicate", async ({ page }) => {
    // Regression test: createOrder (lib/services/orders.js) used to
    // unconditionally insert a new order document on every POST /api/orders,
    // so a checkout left pending (payment dismissed/abandoned) followed by a
    // retry from the cart produced two order documents instead of one.
    await loginAsCustomer(page, "playwright-checkout-retry@example.com", "Checkout Retry Tester", "9876500003");
    userId = await currentUserId(page);
    token = await page.evaluate(() => localStorage.getItem("token"));
    const authHeaders = { Authorization: `Bearer ${token}` };

    const productsRes = await page.request.get("/api/products");
    const { products } = await productsRes.json();
    const product = (products || []).find((p) => (p.variants || []).length > 0);
    test.skip(!product, "no products with variants in this database to test against");
    const variant = product.variants[0];

    const addrRes = await page.request.post("/api/addresses", {
      headers: authHeaders,
      data: {
        name: "Retry Tester", mobile: "9876500003",
        line1: "1 Test Lane", city: "Testville", state: "TS", pincode: "560001",
        is_default: true,
      },
    });
    expect(addrRes.ok()).toBeTruthy();
    addressId = (await addrRes.json()).id;

    // Simulate an earlier checkout that was abandoned before payment - a
    // pending order already sitting in the DB for this user, the way
    // CheckoutView.placeOrder leaves one when the Razorpay modal is
    // dismissed without paying.
    await insertOrder({
      id: `test-abandoned-${userId}`,
      user_id: userId,
      user_mobile: "9876500003",
      user_email: "playwright-checkout-retry@example.com",
      items: [],
      address: {},
      payment_method: "razorpay",
      payment_status: "pending",
      razorpay_order_id: "order_test_abandoned",
      razorpay_payment_id: null,
      subtotal: 0,
      delivery_fee: 0,
      total: 0,
      status: "pending",
      created_at: new Date(Date.now() - 60_000).toISOString(),
    });

    // Hit POST /api/orders directly rather than completing checkout through
    // the UI: in RAZORPAY_MODE=mock, placeOrder() also auto-calls
    // /orders/verify right after, which confirms the order and fires real
    // notifications (EMAIL_MODE=live in .env.local sends a real email - see
    // fireOrderConfirmedNotifications in lib/services/orders.js). This test
    // only needs to check what /api/orders itself persists on retry.
    const orderPayload = {
      items: [{
        product_id: product.id, variant_id: variant.id,
        name: product.name, size: variant.size, price: variant.price,
        qty: 1, image_url: product.image_url,
      }],
      address_id: addressId,
      payment_method: "razorpay",
    };
    const res = await page.request.post("/api/orders", { headers: authHeaders, data: orderPayload });
    expect(res.ok()).toBeTruthy();
    const { order } = await res.json();

    const orders = await findOrdersByUser(userId);
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe(`test-abandoned-${userId}`);
    expect(order.id).toBe(`test-abandoned-${userId}`);
    expect(orders[0].items).toHaveLength(1);
    expect(orders[0].status).toBe("pending");
  });
});
