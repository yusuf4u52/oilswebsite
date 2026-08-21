# E2E tests

Playwright tests that drive the real dev server (see `playwright.config.js`,
which starts `npm run dev` for you). They run against whatever database
`MONGO_URL` in `.env.local` points to — in this project that's the shared dev
database, not a disposable test DB.

**These tests must stay read-only against real data.** No test may create,
edit, or delete a product/order/address, or submit a form that persists —
assert on the UI (fields present, modal opens/closes, no console errors)
instead. The admin "new product" test opens the form and cancels it; it must
never click Save.

## Running

```bash
npx playwright install chromium   # once, downloads the browser binary
npm run test:e2e                  # headless
npm run test:e2e -- --ui          # interactive UI mode
```

Admin tests read `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env.local` (same as the
app) and skip themselves if those aren't set.
