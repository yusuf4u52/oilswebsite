// Shared helpers for the e2e suite.

/** Collects console errors and uncaught page errors thrown while the page is open. */
function trackConsoleErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Seeds the cart in localStorage so checkout tests don't depend on add-to-cart UI. */
async function seedCart(page, items) {
  await page.goto("/shop");
  await page.evaluate((cartItems) => {
    localStorage.setItem("cart_v1", JSON.stringify(cartItems));
  }, items);
}

async function loginAsAdmin(page, email, password) {
  await page.goto("/admin/login");
  await page.fill('[data-testid="admin-email"]', email);
  await page.fill('[data-testid="admin-password"]', password);
  await page.click('[data-testid="admin-login-btn"]');
  await page.waitForURL("**/admin");
}

module.exports = { trackConsoleErrors, seedCart, loginAsAdmin };
