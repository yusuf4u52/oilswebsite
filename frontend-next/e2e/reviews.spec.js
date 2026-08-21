const { test, expect } = require("@playwright/test");
const { trackConsoleErrors } = require("./utils");

// Reviews don't have fixture products to target, so find whatever product
// actually exists in this database rather than hardcoding a slug.
async function firstProductPath(page) {
  await page.goto("/shop");
  const card = page.locator('[data-testid^="product-card-"]').first();
  if ((await card.count()) === 0) return null;
  return card.getAttribute("href");
}

test.describe("product reviews", () => {
  // No fixture user is logged in here, so these exercise the guest state only.
  // Writing a review requires an authenticated session, and per e2e/README.md
  // this suite must never submit a form that persists against the shared dev DB.

  test("guest sees the reviews section but not the write-review form", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const path = await firstProductPath(page);
    test.skip(!path, "no products in this database to test against");

    await page.goto(path);
    await expect(page.locator("#reviews")).toBeVisible();
    await expect(page.getByText("Log in", { exact: false })).toBeVisible();
    await expect(page.locator('[data-testid="review-write-btn"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="review-comment"]')).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("rating badge, when present, scrolls the reviews section into view", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const path = await firstProductPath(page);
    test.skip(!path, "no products in this database to test against");

    await page.goto(path);
    const badge = page.locator('a[href="#reviews"]');
    const badgeCount = await badge.count();
    test.skip(badgeCount === 0, "this product has no reviews yet, so no badge renders");

    await badge.click();
    await expect(page.locator("#reviews")).toBeInViewport();

    expect(errors).toEqual([]);
  });
});
