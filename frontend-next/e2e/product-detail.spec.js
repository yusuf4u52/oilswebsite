const { randomUUID } = require("crypto");
const { test, expect } = require("@playwright/test");
const { trackConsoleErrors, insertProduct, deleteProductById, closeDb } = require("./utils");

// Static files under public/ - guaranteed to exist and load, so image swaps
// can be asserted on `src` without any GridFS/upload dependency.
const PRODUCT_IMAGE = "/media/hero-poster.jpg";
const VARIANT_A_IMAGE = "/logo.png";
const VARIANT_B_IMAGE = "/logo-icon.png";

function productFixture() {
  const id = randomUUID();
  const variantAId = randomUUID();
  const variantBId = randomUUID();
  return {
    id,
    slug: `e2e-variant-image-${id.slice(0, 8)}`,
    name: "E2E Variant Image Oil",
    category: "other",
    short_description: "Playwright fixture product for variant-image coverage.",
    description: "Playwright fixture product for variant-image coverage.",
    image_url: PRODUCT_IMAGE,
    gallery: [],
    variants: [
      { id: variantAId, size: "500ml", price: 100, mrp: 120, stock: 10, image_url: VARIANT_A_IMAGE },
      { id: variantBId, size: "1L", price: 180, mrp: 220, stock: 10, image_url: VARIANT_B_IMAGE },
    ],
    highlights: [],
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

test.describe("product detail — per-variant images", () => {
  let fixture;

  test.afterEach(async () => {
    await deleteProductById(fixture?.id);
    fixture = null;
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("swaps the main image when a different size is selected, and carries the chosen variant's image into the cart", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    fixture = productFixture();
    await insertProduct(fixture);

    await page.goto(`/product/${fixture.slug}`);
    const mainImage = page.locator('[data-testid="pd-main-image"]');
    await expect(mainImage).toHaveAttribute("src", new RegExp(VARIANT_A_IMAGE.replace(".", "\\.")));

    await page.click('[data-testid="variant-1L"]');
    await expect(mainImage).toHaveAttribute("src", new RegExp(VARIANT_B_IMAGE.replace(".", "\\.")));

    await page.click('[data-testid="pd-add-cart"]');
    const cartItem = page.locator(`[data-testid="cart-item-${fixture.variants[1].id}"]`);
    await expect(cartItem).toBeVisible();
    await expect(cartItem.locator("img")).toHaveAttribute("src", new RegExp(VARIANT_B_IMAGE.replace(".", "\\.")));

    expect(errors).toEqual([]);
  });
});
