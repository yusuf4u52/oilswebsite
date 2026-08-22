# Premium Oils — Product Requirements Document

## Overview
An India-focused D2C ecommerce store for cold-pressed / wood-pressed edible oils: Groundnut, Coconut, Almond (culinary + cosmetic grade). Built as a modern, warm, artisan e-commerce experience.

## Tech Stack
- Frontend: React (CRA + craco), Tailwind, sonner, lucide-react, framer-motion
- Backend: FastAPI, Motor (MongoDB async)
- DB: MongoDB (`oils_store`)
- Auth: Google Sign-In + JWT (mock Google mode by default; real mode needs a Google Cloud OAuth client ID), plus mobile number collected post-login for delivery/order-status SMS
- Payments: Razorpay (mock mode; live keys pluggable via env)
- Notifications: MSG91 SMS + SMTP email, both order-status-triggered (mock mode by default; live keys pluggable via env)

## User Personas
1. **Home cook (Priya, 32)** — buys 1L/5L groundnut oil monthly, values purity.
2. **Health-first shopper (Arjun, 28)** — buys virgin coconut oil for cooking & skin.
3. **Gift shopper (Meera)** — buys premium almond oil as gift.
4. **Store admin** — manages catalog, sees orders, updates fulfilment.

## Core Requirements
- Browse products by category
- Product detail with size variants (500ml / 1L / 5L)
- Cart (side drawer) with persistent local storage
- Google Sign-In login, with a follow-up prompt for mobile number (Google doesn't provide one) since delivery/order-status SMS need it
- Address book with add/select flow
- Checkout with Razorpay + COD
- Order history for user
- Admin dashboard: stats, orders (status update), products CRUD

## What's Implemented (2026-01)
- Backend endpoints: /api/auth/google, /api/auth/admin/login, /api/auth/me, /api/products, /api/products/{slug}, /api/admin/products (CRUD), /api/addresses (CRUD), /api/orders (list, create, get, verify, cod-confirm), /api/admin/orders, /api/admin/orders/{id}/status, /api/admin/stats
- Seeded 4 products (2 groundnut, 1 coconut, 1 almond)
- Frontend: Home, Shop (with category filter), Product Detail, Cart drawer, Login (Google Sign-In + mobile-number follow-up), Checkout (address + payment), Orders, Admin Login, Admin Dashboard (stats, orders table, products CRUD)
- Razorpay integrated (mock mode; auto-verifies + records payment in demo)
- Admin: `admin@yourstore.com / Admin@123`

## Backlog / P1
- Real Razorpay live keys (currently mock)
- Real MSG91 auth key + order-status DLT templates (currently blank, SMS is a no-op)
- Product search
- Coupons / promo codes
- Wishlist
- Order tracking with shipping partner
- Reviews & ratings
- Multiple product images gallery UX

## Backlog / P2
- Subscription / auto-refill for oils
- Referral program
- Loyalty points
- Blog / recipes section
- WhatsApp support widget
- WhatsApp ordering bot (conversational ordering via MSG91/WhatsApp) — considered 2026-08, deferred in favor of SMS-only order status notifications (see Fixes below). Bigger scope: catalog sync, conversational flow, payment handoff.
- Real Google OAuth client ID — Google Sign-In (see Fixes 2026-08 below) currently runs in `GOOGLE_MODE=mock`; going live needs a Google Cloud Console OAuth Web client ID.

## Fixes (2026-01)
- Fixed cart hydration race in CartContext (lazy-init from localStorage) so /checkout no longer redirects to /shop on refresh with a saved cart.

## Fixes (2026-08-18, latest)
- Added on-page/technical SEO foundation (frontend is a CRA client-side-rendered SPA, so this covers what's achievable without an SSR migration). `frontend/src/components/SEO.js` wraps `react-helmet-async` to set per-route `<title>`, meta description, canonical URL, Open Graph/Twitter tags, and optional JSON-LD; wired into Home, Shop (category-aware titles), ProductDetail (dynamic `Product` schema with per-variant `Offer`s), About, and Contact. `frontend/public/index.html` got sitewide default meta/OG/Twitter tags plus static `Organization`/`WebSite` JSON-LD (so non-JS crawlers and social link-preview bots, which don't execute the SPA's JS, still see reasonable defaults on first paint — only Google-class crawlers that render JS will see the per-page overrides). Added `frontend/public/robots.txt` (disallows `/admin`, `/checkout`, `/orders`, `/profile`) and a build-time-generated `frontend/public/sitemap.xml` (`frontend/scripts/generate-sitemap.js`, wired as an npm `prebuild` hook — fetches live products from `/api/products` for per-product URLs, falls back to static routes only if the backend is unreachable). Site URL defaults to the placeholder `https://www.premiumoils.in` (`frontend/src/constants/seo.js`, overridable via `REACT_APP_SITE_URL`) since **no production domain is configured anywhere in the repo yet** — this needs to be swapped for the real domain before the meta tags/sitemap/robots.txt are meaningful in production, and Google Search Console + a Google Business Profile still need setting up manually once the site is live (outside what a coding change can do).
- Extended the above with Hindi/Hinglish keyword coverage, particularly spelling variants of "Kachi Ghani" (the traditional wood-press method, a high-intent regional search term): `kachi ghani`, `kacchi ghani`, `kachhi ghani`, `kacha ghani`, and Devanagari `कच्ची घानी`, plus category terms (`मूंगफली का तेल`, `नारियल तेल`, `बादाम तेल`, `shuddh tel`). Added a `keywords` prop to `SEO.js` (renders `<meta name="keywords">` — Google ignores this tag for ranking, included mainly for completeness/other engines) with a sitewide default plus per-category overrides in `Shop.js`. More importantly, wove the same terms into actual visible copy where accurate: a new explainer paragraph on `About.js`, the Home hero chip, and the product seed data in `backend/server.py` (`seed_products_if_empty()` — groundnut oil description/highlights now spell out the Kachi Ghani variants, coconut/almond descriptions gained their Hindi terms). **Caveat:** `seed_products_if_empty()` only runs `if count == 0`, so this does not retroactively update any already-seeded/live MongoDB product documents — a fresh/empty DB gets the new copy automatically, but an existing deployment needs the products manually re-edited (admin dashboard or a one-off DB update) to pick it up.

## Fixes (2026-08-18, later)
- Added SMTP email integration (`backend/server.py`): `_send_email()` sends via `smtplib`, gated by `EMAIL_MODE=mock|live` (same convention as Google/Razorpay/MSG91). Wired into the same order-status trigger points as the existing MSG91 SMS (`/orders/verify`, the Razorpay webhook, `/orders/{id}/cod-confirm`, `/admin/orders/{id}/status`): customers get an order-confirmation email when payment is confirmed/COD-confirmed and status-update emails for shipped/delivered/cancelled; the admin (`ADMIN_EMAIL`) gets a new-order alert email at the same confirmation points. All best-effort/non-blocking like the SMS sends — a failed email never fails the order request. Orders now also store `user_email` (alongside the existing `user_mobile`) captured at creation time. `EMAIL_MODE=mock` and blank `SMTP_*`/`EMAIL_FROM` in `backend/.env`/`backend/.env.example` by default — mock mode just logs the email. All 25 backend tests pass.

## Fixes (2026-08)
- Wired real MSG91 SMS delivery for mobile OTP login (`send_otp_sms()`). **Superseded 2026-08-18** — see below; OTP login was removed.
- Added MSG91 order-status SMS notifications (`send_order_status_sms()` in `backend/server.py`), hooked into all four places an order reaches `confirmed`/`shipped`/`delivered`/`cancelled`: `/orders/verify`, the Razorpay webhook, `/orders/{id}/cod-confirm`, and `/admin/orders/{id}/status`. This is best-effort/non-blocking — a failed SMS never fails the order request — and each status needs its own DLT-approved template id (`MSG91_ORDER_{CONFIRMED,SHIPPED,DELIVERED,CANCELLED}_TEMPLATE_ID` in `backend/.env`, all currently blank so this is a no-op until filled in). Also added idempotency guards (`status: {"$ne": ...}` filters) at each of the four call sites so retried/duplicate calls don't re-send notifications.
- Replaced mobile-OTP login with Google Sign-In (`POST /api/auth/google` in `backend/server.py`, gated by `GOOGLE_MODE=mock|live`; `frontend/src/components/AuthGate.js` on the frontend). Trigger: `backend/.env` had `OTP_MODE=live` with no MSG91 credentials, so OTP login was already 502ing for real customers. Google doesn't return a phone number, so a first-login-only "add your mobile number" step was added (`needs_mobile` in the login response), used both on `/login` and inline on `/checkout`. Users are now keyed on `google_id`; `mobile` is optional/sparse-unique instead of the old hard-unique login identifier. Also fixed a bug where an admin login session made the storefront header wrongly show the customer account dropdown (`Header`/`RequireAuth` now check `user.role !== "admin"`, not just truthy `user`). `GOOGLE_MODE=mock` by default — going live needs a real Google Cloud OAuth Web client ID (see Backlog/P2).
