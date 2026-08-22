const { randomUUID } = require("crypto");
const { test, expect } = require("@playwright/test");
const { trackConsoleErrors, loginAsAdmin, insertOrder, deleteOrderById, closeDb } = require("./utils");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function orderFixture(overrides) {
  const id = randomUUID();
  return {
    id,
    user_id: "playwright-admin-orders-user",
    user_mobile: "9876500099",
    user_email: "playwright-admin-orders@example.com",
    items: [{ product_id: "p1", variant_id: "v1", name: "Test Oil", size: "500ml", price: 280, qty: 1, image_url: "" }],
    address: { name: "Playwright Tester", mobile: "9876500099" },
    payment_method: "razorpay",
    payment_status: "pending",
    razorpay_order_id: `order_test_${id}`,
    razorpay_payment_id: null,
    subtotal: 280,
    delivery_fee: 49,
    total: 329,
    status: "pending",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

test.describe("admin dashboard", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "requires ADMIN_EMAIL/ADMIN_PASSWORD in .env.local");

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("logs in and shows the stats + orders tab by default", async ({ page }) => {
    const errors = trackConsoleErrors(page);

    await expect(page.getByText("Premium Oils · Console")).toBeVisible();
    await expect(page.getByText("Revenue")).toBeVisible();
    await expect(page.getByText("Orders", { exact: true })).toBeVisible();
    await expect(page.getByText("Products", { exact: true })).toBeVisible();
    await expect(page.getByText("Customers", { exact: true })).toBeVisible();
    // Orders tab table header, confirming OrdersTab rendered.
    await expect(page.getByRole("columnheader", { name: "Order" })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("products tab renders, and the new-product modal opens and cancels without saving", async ({ page }) => {
    const errors = trackConsoleErrors(page);

    await page.click('[data-testid="admin-tab-products"]');
    await expect(page.getByRole("button", { name: "New Product" })).toBeVisible();

    await page.click('[data-testid="admin-new-product"]');
    await expect(page.locator('[data-testid="pf-save"]')).toBeVisible();

    // Never click Save here — this suite runs against the real dev database.
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator('[data-testid="pf-save"]')).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("customers tab renders", async ({ page }) => {
    const errors = trackConsoleErrors(page);

    await page.click('[data-testid="admin-tab-customers"]');
    await expect(page.getByRole("columnheader", { name: "Customer" })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("reviews tab renders", async ({ page }) => {
    const errors = trackConsoleErrors(page);

    await page.click('[data-testid="admin-tab-reviews"]');
    await expect(page.getByRole("columnheader", { name: "Product" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Rating" })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test.describe("order deletion", () => {
    let orderId;

    test.afterEach(async () => {
      await deleteOrderById(orderId);
      orderId = null;
    });

    test.afterAll(async () => {
      await closeDb();
    });

    test("shows a delete button for an unpaid order and removes it from the list on delete", async ({ page }) => {
      const errors = trackConsoleErrors(page);
      const fixture = orderFixture({ payment_status: "pending" });
      orderId = fixture.id;
      await insertOrder(fixture);

      await page.reload();
      const row = page.locator(`[data-testid="admin-order-${orderId}"]`);
      await expect(row).toBeVisible();
      await expect(row.getByText("unpaid")).toBeVisible();

      page.once("dialog", (dialog) => dialog.accept());
      await row.locator(`[data-testid="admin-order-delete-${orderId}"]`).click();

      await expect(row).toHaveCount(0);

      expect(errors).toEqual([]);
    });

    test("does not show a delete button for a paid order", async ({ page }) => {
      const errors = trackConsoleErrors(page);
      const fixture = orderFixture({ payment_status: "paid" });
      orderId = fixture.id;
      await insertOrder(fixture);

      await page.reload();
      const row = page.locator(`[data-testid="admin-order-${orderId}"]`);
      await expect(row).toBeVisible();
      await expect(row.locator(`[data-testid="admin-order-delete-${orderId}"]`)).toHaveCount(0);

      expect(errors).toEqual([]);
    });

    // A cancelled order is still unpaid if it never got paid before cancellation
    // (updateOrderStatusAdmin lets "cancelled" through regardless of payment_status,
    // unlike confirmed/shipped/delivered) — deletion cares about payment, not
    // order status, so this should be deletable same as a plain pending-unpaid order.
    test("shows a delete button for a cancelled unpaid order and allows deleting it", async ({ page }) => {
      const errors = trackConsoleErrors(page);
      const fixture = orderFixture({ payment_status: "pending", status: "cancelled" });
      orderId = fixture.id;
      await insertOrder(fixture);

      await page.reload();
      const row = page.locator(`[data-testid="admin-order-${orderId}"]`);
      await expect(row).toBeVisible();

      page.once("dialog", (dialog) => dialog.accept());
      await row.locator(`[data-testid="admin-order-delete-${orderId}"]`).click();

      await expect(row).toHaveCount(0);

      expect(errors).toEqual([]);
    });
  });
});
