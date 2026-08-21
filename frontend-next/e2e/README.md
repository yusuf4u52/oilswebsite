# E2E tests

Playwright tests that drive the real dev server (see `playwright.config.js`,
which starts `npm run dev` for you). They run against whatever database
`MONGO_URL` in `.env.local` points to — in this project that's a local
MongoDB instance (`mongodb://localhost:27017`), not a database shared with
teammates or production.

**Tests may persist data (create a review, log in as a customer, etc.), but
must clean up after themselves.** Use `e2e/utils.js`'s Mongo helpers
(`deleteReviewsByUser`, or add a similar one for a new collection) in a
`test.afterEach`/`afterAll` so a run leaves the local database the way it
found it — don't rely on manual cleanup or assume the next run starts fresh.
This project follows test-driven development going forward: write the test
for a behavior (or its regression) alongside/before the code that implements
it, not just as an afterthought once something breaks.

The one thing to still avoid: mutating a **product** doc's core catalog
fields (price, stock, slug) from a test, since those aren't cleaned up by the
helpers above and would drift the local catalog you're developing against.
The admin "new product" test still opens the form and cancels it rather than
saving, for that reason.

## Running

```bash
npx playwright install chromium   # once, downloads the browser binary
npm run test:e2e                  # headless
npm run test:e2e -- --ui          # interactive UI mode
```

Admin tests read `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env.local` (same as the
app) and skip themselves if those aren't set.
