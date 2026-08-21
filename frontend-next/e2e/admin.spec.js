const { test, expect } = require("@playwright/test");
const { trackConsoleErrors, loginAsAdmin } = require("./utils");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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
});
