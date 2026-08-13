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
- Real MSG91 SMS integration (currently mock)
- Real Razorpay live keys (currently mock)
- Product search
- Coupons / promo codes
- Wishlist
- Order tracking with shipping partner
- Email/SMS notifications on order events
- Reviews & ratings
- Multiple product images gallery UX

## Backlog / P2
- Subscription / auto-refill for oils
- Referral program
- Loyalty points
- Blog / recipes section
- WhatsApp support widget

## Fixes (2026-01)
- Fixed cart hydration race in CartContext (lazy-init from localStorage) so /checkout no longer redirects to /shop on refresh with a saved cart.
