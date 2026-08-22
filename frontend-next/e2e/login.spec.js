const { test, expect } = require("@playwright/test");
const { trackConsoleErrors, seedCart, completeMockLogin } = require("./utils");

const TEST_EMAIL = "playwright-header-login@example.com";
const TEST_NAME = "Header Login Tester";

test("logging in via the header button returns to the page you were on, not home", async ({ page }) => {
  // Regression test: Header.js's "Login" nav button does
  // router.push("/login") with no ?next= param, so LoginPage
  // (app/(site)/login/page.js) defaults `next` to "/". AuthGate's onDone
  // then does router.push(next) = router.push("/"), so a guest who clicks
  // the header Login button while on any other page (e.g. mid-checkout)
  // lands on the homepage instead of back where they were.
  const errors = trackConsoleErrors(page);

  await seedCart(page, [
    { product_id: "p1", variant_id: "v1", name: "Test Oil", size: "500ml", price: 280, qty: 1, image_url: "" },
  ]);
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/checkout$/);

  await page.click('[data-testid="nav-login"]');
  await expect(page).toHaveURL(/\/login/);

  await completeMockLogin(page, TEST_EMAIL, TEST_NAME, "9876500001");

  await expect(page).toHaveURL(/\/checkout$/);

  expect(errors).toEqual([]);
});

test("the sign-in card is positioned consistently whether reached from /login or inline on /checkout", async ({ page }) => {
  // Regression test: LoginView (components/views/LoginView.js) wraps AuthGate
  // in "max-w-md mx-auto ... text-center" (centered on the page), while
  // InlineLogin (components/checkout/InlineLogin.js) wraps the same AuthGate
  // in just "max-w-md" (left-aligned, no mx-auto). A guest sees two visibly
  // different layouts for what is conceptually the same sign-in step,
  // depending on how they got there.
  const isCardCentered = async () => {
    const box = await page.locator('[data-testid="google-mock-submit"]').boundingBox();
    const viewportWidth = page.viewportSize().width;
    const cardCenter = box.x + box.width / 2;
    return Math.abs(cardCenter - viewportWidth / 2) < 40;
  };

  await page.goto("/login");
  const loginPageCentered = await isCardCentered();

  await seedCart(page, [
    { product_id: "p1", variant_id: "v1", name: "Test Oil", size: "500ml", price: 280, qty: 1, image_url: "" },
  ]);
  await page.goto("/checkout");
  const checkoutInlineCentered = await isCardCentered();

  expect(checkoutInlineCentered).toBe(loginPageCentered);
});
