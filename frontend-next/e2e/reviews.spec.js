const { test, expect } = require("@playwright/test");
const { trackConsoleErrors, loginAsCustomer, currentUserId, deleteReviewsByUser, closeDb } = require("./utils");

const TEST_EMAIL = "playwright-reviews@example.com";
const TEST_NAME = "Playwright Tester";

// Reviews don't have fixture products to target, so find whatever product
// actually exists in this database rather than hardcoding a slug.
async function firstProductPath(page) {
  await page.goto("/shop");
  const card = page.locator('[data-testid^="product-card-"]').first();
  if ((await card.count()) === 0) return null;
  return card.getAttribute("href");
}

test.describe("product reviews - guest", () => {
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

test.describe("product reviews - authenticated", () => {
  let userId;

  test.afterEach(async () => {
    await deleteReviewsByUser(userId);
    userId = null;
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("logged-in customer can post a review and see it appear without a reload", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const path = await firstProductPath(page);
    test.skip(!path, "no products in this database to test against");

    await loginAsCustomer(page, TEST_EMAIL, TEST_NAME);
    userId = await currentUserId(page);
    expect(userId).toBeTruthy();

    await page.goto(path);
    await page.click('[data-testid="review-write-btn"]');
    await page.click('[data-testid="review-star-4"]');
    await page.fill('[data-testid="review-comment"]', "Great oil, will buy again.");
    await page.click('[data-testid="review-submit"]');

    await expect(page.getByText(TEST_NAME)).toBeVisible();
    await expect(page.getByText("Great oil, will buy again.")).toBeVisible();
    // Regression check: the top-of-page rating badge shares state with the
    // review list (see context/ProductReviewsContext.js) - it must reflect
    // the new review immediately, not only after a reload.
    await expect(page.locator('a[href="#reviews"]')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("editing an existing review updates it in place rather than duplicating it", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const path = await firstProductPath(page);
    test.skip(!path, "no products in this database to test against");

    await loginAsCustomer(page, TEST_EMAIL, TEST_NAME);
    userId = await currentUserId(page);

    await page.goto(path);
    await page.click('[data-testid="review-write-btn"]');
    await page.click('[data-testid="review-star-3"]');
    await page.fill('[data-testid="review-comment"]', "Decent, a bit pricey.");
    await page.click('[data-testid="review-submit"]');
    await expect(page.getByText("Decent, a bit pricey.")).toBeVisible();

    await page.click('[data-testid="review-edit-btn"]');
    await expect(page.locator('[data-testid="review-comment"]')).toHaveValue("Decent, a bit pricey.");
    await page.click('[data-testid="review-star-5"]');
    await page.fill('[data-testid="review-comment"]', "Actually excellent, changed my mind.");
    await page.click('[data-testid="review-submit"]');

    await expect(page.getByText("Actually excellent, changed my mind.")).toBeVisible();
    await expect(page.getByText("Decent, a bit pricey.")).toHaveCount(0);
    // One review per user per product (see lib/services/reviews.js upsertReview) -
    // editing must not leave the old one behind as a second entry.
    await expect(page.getByText(TEST_NAME)).toHaveCount(1);

    expect(errors).toEqual([]);
  });
});
