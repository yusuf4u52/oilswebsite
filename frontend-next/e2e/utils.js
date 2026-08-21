const { MongoClient } = require("mongodb");

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

/**
 * Logs in through the real /login UI using AuthGate's mock-Google form
 * (GOOGLE_MODE=mock locally, no NEXT_PUBLIC_GOOGLE_CLIENT_ID - see .env.local).
 * This persists/updates a row in the `users` collection, same as a real user.
 */
async function loginAsCustomer(page, email, name) {
  await page.goto("/login");
  await page.fill('[data-testid="google-mock-email"]', email);
  await page.fill('[data-testid="google-mock-name"]', name);
  await page.click('[data-testid="google-mock-submit"]');
  // LoginView redirects via router.push (client-side, no "load" event), so
  // waitForURL would hang on its default waitUntil: "load". Wait on the
  // actual signal instead - AuthContext.loginWithToken sets this synchronously.
  await page.waitForFunction(() => !!localStorage.getItem("token"));
}

/** Reads the JWT payload's `sub` (the app's internal user id) out of localStorage. */
async function currentUserId(page) {
  const token = await page.evaluate(() => localStorage.getItem("token"));
  if (!token) return null;
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  return payload.sub;
}

// Direct MongoDB access for test fixtures/cleanup. MONGO_URL/DB_NAME point at the
// local dev database (see playwright.config.js's loadEnvConfig) - not the shared
// team database, so tests are free to persist data as long as they clean up after
// themselves (see e2e/README.md).
let client;
async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
  }
  return client.db(process.env.DB_NAME);
}

/** Removes every review written by a given user id - call in afterEach/afterAll. */
async function deleteReviewsByUser(userId) {
  if (!userId) return;
  const db = await getDb();
  await db.collection("reviews").deleteMany({ user_id: userId });
}

async function closeDb() {
  if (client) {
    await client.close();
    client = null;
  }
}

module.exports = {
  trackConsoleErrors,
  seedCart,
  loginAsAdmin,
  loginAsCustomer,
  currentUserId,
  deleteReviewsByUser,
  closeDb,
};
