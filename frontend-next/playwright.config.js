// @ts-check
const { defineConfig, devices } = require("@playwright/test");
const { loadEnvConfig } = require("@next/env");

// Load .env.local the same way `next dev` does, so tests see ADMIN_EMAIL,
// ADMIN_PASSWORD, etc. without duplicating them into a separate test env file.
loadEnvConfig(__dirname);

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: "./e2e",
  // These tests share one dev server and one live database (see e2e/README.md).
  // Running them in parallel causes contention (slow Mongo aggregations under
  // concurrent load) rather than isolation, so keep it serial.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
