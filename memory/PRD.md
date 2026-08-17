# Premium Oils — Product Requirements Document

## Overview
An India-focused D2C ecommerce store for cold-pressed / wood-pressed edible oils: Groundnut, Coconut, Almond (culinary + cosmetic grade). Built as a modern, warm, artisan e-commerce experience.

## Tech Stack
- Frontend: React (CRA + craco), Tailwind, sonner, lucide-react, framer-motion
- Backend: FastAPI, Motor (MongoDB async)
- DB: MongoDB (`oils_store`)
- Auth: Mobile OTP + JWT (mock OTP mode; MSG91 wiring ready)
- Payments: Razorpay (mock mode; live keys pluggable via env)

## User Personas
1. **Home cook (Priya, 32)** — buys 1L/5L groundnut oil monthly, values purity.
2. **Health-first shopper (Arjun, 28)** — buys virgin coconut oil for cooking & skin.
3. **Gift shopper (Meera)** — buys premium almond oil as gift.
4. **Store admin** — manages catalog, sees orders, updates fulfilment.

## Core Requirements
- Browse products by category
- Product detail with size variants (500ml / 1L / 5L)
- Cart (side drawer) with persistent local storage
- Mobile OTP login (10-digit + 6-digit code)
- Address book with add/select flow
- Checkout with Razorpay + COD
- Order history for user
- Admin dashboard: stats, orders (status update), products CRUD

## What's Implemented (2026-01)
- Backend endpoints: /api/auth/otp/{request,verify}, /api/auth/admin/login, /api/auth/me, /api/products, /api/products/{slug}, /api/admin/products (CRUD), /api/addresses (CRUD), /api/orders (list, create, get, verify, cod-confirm), /api/admin/orders, /api/admin/orders/{id}/status, /api/admin/stats
- Seeded 4 products (2 groundnut, 1 coconut, 1 almond)
- Frontend: Home, Shop (with category filter), Product Detail, Cart drawer, Login (OTP), Checkout (address + payment), Orders, Admin Login, Admin Dashboard (stats, orders table, products CRUD)
- Razorpay integrated (mock mode; auto-verifies + records payment in demo)
- Admin: `admin@yourstore.com / Admin@123`

## Backlog / P1
- Real Razorpay live keys (currently mock)
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
- Google login — considered 2026-08, explicitly deferred. Decision if revisited: keep as a second independent auth method alongside mobile OTP (not a replacement, not merged by email/mobile match), since delivery/COD still needs a verified phone number.
- WhatsApp ordering bot (conversational ordering via MSG91/WhatsApp) — considered 2026-08, deferred in favor of SMS-only order status notifications (see Fixes below). Bigger scope: catalog sync, conversational flow, payment handoff.

## Fixes (2026-01)
- Fixed cart hydration race in CartContext (lazy-init from localStorage) so /checkout no longer redirects to /shop on refresh with a saved cart.

## Fixes (2026-08)
- Wired real MSG91 SMS delivery for mobile OTP login. `send_otp_sms()` in `backend/server.py` calls MSG91's Flow API when `OTP_MODE=live`; OTP generation/storage/verification logic is unchanged (still handled locally in `db.otps`), MSG91 is only used to transmit the code. Requires `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` (a DLT-approved Flow template with an `OTP` variable) in `backend/.env`. Left `OTP_MODE=mock` in the live `.env` until real MSG91 credentials are supplied — flipping it without credentials would break login (request endpoint returns 502).
- Added MSG91 order-status SMS notifications (`send_order_status_sms()` in `backend/server.py`), hooked into all four places an order reaches `confirmed`/`shipped`/`delivered`/`cancelled`: `/orders/verify`, the Razorpay webhook, `/orders/{id}/cod-confirm`, and `/admin/orders/{id}/status`. Unlike OTP send, this is best-effort/non-blocking — a failed SMS never fails the order request — and each status needs its own DLT-approved template id (`MSG91_ORDER_{CONFIRMED,SHIPPED,DELIVERED,CANCELLED}_TEMPLATE_ID` in `backend/.env`, all currently blank so this is a no-op until filled in). Also added idempotency guards (`status: {"$ne": ...}` filters) at each of the four call sites so retried/duplicate calls don't re-send notifications.
