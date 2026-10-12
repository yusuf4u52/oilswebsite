const { test, expect } = require("@playwright/test");
const {
  trackConsoleErrors,
  seedCart,
  loginAsAdmin,
  loginAsCustomer,
  currentUserId,
  findOrdersByUser,
  deleteOrderById,
  getSettingDoc,
  setSettingDoc,
  closeDb,
} = require("./utils");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Shipping rules live in the `settings` collection (doc id "shipping") so the
// admin can change them without a deploy. Every test here rewrites that doc,
// so snapshot whatever the developer had configured and put it back after.
let originalShipping;

test.beforeAll(async () => {
  originalShipping = await getSettingDoc("shipping");
});

test.afterAll(async () => {
  await setSettingDoc("shipping", originalShipping);
  await closeDb();
});

const CART_ITEM = { product_id: "p1", variant_id: "v1", name: "Test Oil", size: "500ml", price: 280, qty: 1, image_url: "" };

test("public shipping endpoint falls back to the ₹49 / free-above-₹499 defaults when nothing is configured", async ({ page }) => {
  await setSettingDoc("shipping", null);

  const res = await page.request.get("/api/settings/shipping");
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ delivery_fee: 49, free_delivery_threshold: 499 });
});

test("updating shipping settings requires an admin", async ({ page }) => {
  const res = await page.request.put("/api/admin/settings/shipping", {
    data: { delivery_fee: 0, free_delivery_threshold: null },
  });
  expect(res.status()).toBe(401);
});

test("cart drawer charges the configured delivery fee below the threshold", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await setSettingDoc("shipping", { delivery_fee: 75, free_delivery_threshold: 1000 });

  await seedCart(page, [CART_ITEM]);
  await page.reload();
  await page.click('[data-testid="nav-cart"]');

  await expect(page.locator('[data-testid="cart-delivery"]')).toHaveText("₹75");
  await expect(page.locator('[data-testid="cart-total"]')).toHaveText("₹355");

  expect(errors).toEqual([]);
});

test("cart drawer shows FREE delivery once the subtotal reaches the configured threshold", async ({ page }) => {
  await setSettingDoc("shipping", { delivery_fee: 75, free_delivery_threshold: 250 });

  await seedCart(page, [CART_ITEM]);
  await page.reload();
  await page.click('[data-testid="nav-cart"]');

  await expect(page.locator('[data-testid="cart-delivery"]')).toHaveText("FREE");
  await expect(page.locator('[data-testid="cart-total"]')).toHaveText("₹280");
});

test("with no free-delivery threshold, every order pays the fee", async ({ page }) => {
  await setSettingDoc("shipping", { delivery_fee: 60, free_delivery_threshold: null });

  await seedCart(page, [{ ...CART_ITEM, qty: 10 }]);
  await page.reload();
  await page.click('[data-testid="nav-cart"]');

  await expect(page.locator('[data-testid="cart-delivery"]')).toHaveText("₹60");
  await expect(page.locator('[data-testid="cart-total"]')).toHaveText("₹2,860");
});

test.describe("server-side order totals", () => {
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

  test("POST /api/orders charges the configured delivery fee, not the hard-coded one", async ({ page }) => {
    // The server recomputes totals itself (never trusting the client), so it
    // must read the same stored settings the cart does or the two drift.
    await loginAsCustomer(page, "playwright-shipping@example.com", "Shipping Tester", "9876500004");
    userId = await currentUserId(page);
    token = await page.evaluate(() => localStorage.getItem("token"));
    const authHeaders = { Authorization: `Bearer ${token}` };

    const { products } = await (await page.request.get("/api/products")).json();
    const product = (products || []).find((p) => (p.variants || []).length > 0);
    test.skip(!product, "no products with variants in this database to test against");
    const variant = product.variants[0];

    // Threshold just above this one-item cart, so the fee always applies.
    await setSettingDoc("shipping", { delivery_fee: 87, free_delivery_threshold: variant.price + 1 });

    const addrRes = await page.request.post("/api/addresses", {
      headers: authHeaders,
      data: {
        name: "Shipping Tester", mobile: "9876500004",
        line1: "1 Test Lane", city: "Testville", state: "TS", pincode: "560001",
        is_default: true,
      },
    });
    expect(addrRes.ok()).toBeTruthy();
    addressId = (await addrRes.json()).id;

    // Direct API call, not the UI: in RAZORPAY_MODE=mock the UI flow auto-
    // verifies and fires real notifications (see checkout.spec.js).
    const res = await page.request.post("/api/orders", {
      headers: authHeaders,
      data: {
        items: [{ product_id: product.id, variant_id: variant.id, qty: 1 }],
        address_id: addressId,
        payment_method: "razorpay",
      },
    });
    expect(res.ok()).toBeTruthy();
    const { order } = await res.json();
    expect(order.delivery_fee).toBe(87);
    expect(order.total).toBe(variant.price + 87);
  });
});

test.describe("admin shipping tab", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "requires ADMIN_EMAIL/ADMIN_PASSWORD in .env.local");

  test("admin can view and change the delivery fee and free-delivery threshold", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await setSettingDoc("shipping", { delivery_fee: 49, free_delivery_threshold: 499 });

    await loginAsAdmin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.click('[data-testid="admin-tab-shipping"]');

    const fee = page.locator('[data-testid="ship-fee"]');
    const threshold = page.locator('[data-testid="ship-threshold"]');
    await expect(fee).toHaveValue("49");
    await expect(threshold).toHaveValue("499");

    await fee.fill("65");
    await threshold.fill("799");
    await page.click('[data-testid="ship-save"]');
    await expect(page.getByText("Shipping settings saved")).toBeVisible();

    const res = await page.request.get("/api/settings/shipping");
    expect(await res.json()).toEqual({ delivery_fee: 65, free_delivery_threshold: 799 });

    // Clearing the threshold turns free delivery off entirely.
    await threshold.fill("");
    await page.click('[data-testid="ship-save"]');
    await expect(page.getByText("Shipping settings saved").first()).toBeVisible();
    await expect.poll(async () => (await (await page.request.get("/api/settings/shipping")).json()))
      .toEqual({ delivery_fee: 65, free_delivery_threshold: null });

    expect(errors).toEqual([]);
  });

  test("admin API rejects a negative delivery fee", async ({ page }) => {
    await loginAsAdmin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const token = await page.evaluate(() => localStorage.getItem("token"));

    const res = await page.request.put("/api/admin/settings/shipping", {
      headers: { Authorization: `Bearer ${token}` },
      data: { delivery_fee: -5, free_delivery_threshold: 499 },
    });
    expect(res.status()).toBe(400);
  });
});
