const { randomUUID } = require("crypto");
const { test, expect } = require("@playwright/test");
const {
  trackConsoleErrors,
  loginAsAdmin,
  insertProduct,
  deleteProductById,
  closeDb,
} = require("./utils");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const PRODUCT_IMAGE = "/media/hero-poster.jpg";

function productFixture(overrides) {
  const id = randomUUID();
  return {
    id,
    slug: `e2e-uses-${id.slice(0, 8)}`,
    name: "E2E Uses Oil",
    category: "other",
    short_description: "Playwright fixture product for Uses & Benefits coverage.",
    description: "Playwright fixture product for Uses & Benefits coverage.",
    image_url: PRODUCT_IMAGE,
    gallery: [],
    variants: [{ id: randomUUID(), size: "500ml", price: 100, mrp: 120, stock: 10, image_url: "" }],
    highlights: [],
    uses: [],
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

test.describe("product detail — Uses & Benefits", () => {
  let fixture;

  test.afterEach(async () => {
    await deleteProductById(fixture?.id);
    fixture = null;
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("renders each use with its citation link when the product has uses", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    fixture = productFixture({
      uses: [
        {
          heading: "Traditional massage oil",
          description: "Warmed and used for everyday Ayurvedic massage (Abhyanga).",
          source_name: "Wikipedia",
          source_url: "https://en.wikipedia.org/wiki/Peanut_oil",
        },
        {
          heading: "Nourishing for skin",
          description: "Traditionally used to moisturize dry skin.",
          source_name: "Ayur Times",
          source_url: "https://ayurtimes.com/peanut-groundnut-oil-benefits-uses/",
        },
      ],
    });
    await insertProduct(fixture);

    await page.goto(`/product/${fixture.slug}`);
    const section = page.locator('[data-testid="product-uses"]');
    await expect(section).toBeVisible();
    await expect(section.getByText("Traditional massage oil")).toBeVisible();
    await expect(section.getByText("Warmed and used for everyday Ayurvedic massage (Abhyanga).")).toBeVisible();

    const firstSource = page.locator('[data-testid="product-use-source-0"]');
    await expect(firstSource).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Peanut_oil");
    await expect(firstSource).toHaveAttribute("target", "_blank");
    await expect(firstSource).toHaveAttribute("rel", /noopener/);
    await expect(firstSource).toContainText("Wikipedia");

    const secondSource = page.locator('[data-testid="product-use-source-1"]');
    await expect(secondSource).toHaveAttribute("href", "https://ayurtimes.com/peanut-groundnut-oil-benefits-uses/");
    await expect(secondSource).toContainText("Ayur Times");

    expect(errors).toEqual([]);
  });

  test("omits the section entirely for a product with no uses", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    fixture = productFixture({ uses: [] });
    await insertProduct(fixture);

    await page.goto(`/product/${fixture.slug}`);
    await expect(page.locator('[data-testid="product-uses"]')).toHaveCount(0);

    expect(errors).toEqual([]);
  });
});

test.describe("admin — editing a product's Uses & Benefits", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "requires ADMIN_EMAIL/ADMIN_PASSWORD in .env.local");

  let fixture;

  test.afterEach(async () => {
    await deleteProductById(fixture?.id);
    fixture = null;
  });

  test.afterAll(async () => {
    await closeDb();
  });

  test("adds a use with a citation and persists it to the product page", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    fixture = productFixture();
    await insertProduct(fixture);

    await loginAsAdmin(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.click('[data-testid="admin-tab-products"]');
    await page.click(`[data-testid="admin-edit-${fixture.slug}"]`);
    await expect(page.locator('[data-testid="pf-save"]')).toBeVisible();

    await page.click('[data-testid="pf-uses-add"]');
    await page.fill('[data-testid="pf-uses-heading-0"]', "Scalp & hair nourishment");
    await page.fill('[data-testid="pf-uses-desc-0"]', "Massaged into the scalp to condition hair.");
    await page.fill('[data-testid="pf-uses-source-0"]', "Wikipedia");
    await page.fill('[data-testid="pf-uses-url-0"]', "https://en.wikipedia.org/wiki/Coconut_oil");

    await page.click('[data-testid="pf-save"]');
    await expect(page.locator('[data-testid="pf-save"]')).toHaveCount(0);

    await page.goto(`/product/${fixture.slug}`);
    const source = page.locator('[data-testid="product-use-source-0"]');
    await expect(page.getByText("Scalp & hair nourishment")).toBeVisible();
    await expect(source).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Coconut_oil");

    expect(errors).toEqual([]);
  });
});
