# KrishiConnect — current scope

This repository is a deployment-oriented full-stack MVP for a farm-to-home
marketplace.

## Frontend

- React 18 + Vite
- React Router with stable direct URLs
- Responsive marketplace, authentication, profile, farmer, cart and admin UI
- Blog and recipe pages/sliders
- Advertisement slider
- KisanDirect AI page at `/kisandirect-ai` (also `/ai`)
- Admin pages with stable URLs:
  - `/admin`
  - `/admin/overview`
  - `/admin/approvals`
  - `/admin/products`
  - `/admin/recipes`
  - `/admin/advertisements`
- Deployment diagnostics at `/system-status`
- Vercel SPA rewrite so refreshing `/login`, `/profile`, `/recipes/foo`, etc.
  resolves to the React app instead of a 404

## Backend

- Spring Boot 3.5 / Java 21
- PostgreSQL + Flyway
- Firebase Admin token verification for email/Google authentication
- Backend JWT for the legacy/admin login
- Consumer / Farmer / Admin role authorization
- Product search and pagination
- Farmer product creation and ImageKit image upload
- Persistent cart
- Checkout/order services
- Notifications
- Recipe and advertisement management
- Gemini-backed agriculture assistant
- Profile updates and ImageKit profile-image upload
- `GET /api/status` safe dependency diagnostics

## Deployment architecture

Recommended production flow:

Browser → Vercel `/api/*` gateway → Railway primary backend → PostgreSQL

If Railway is unavailable, safe read requests can fail over to the Render
backup backend. Write requests are intentionally not replayed automatically
because retrying a timed-out order/upload could create duplicates.

Both Railway and Render must have the same database/authentication/AI/ImageKit
configuration.

## Required production variables

### Vercel

- `PRIMARY_BACKEND_URL` — Railway backend base URL
- `BACKUP_BACKEND_URL` — Render backend base URL
- `VITE_API_BASE_URL=/api`
- Firebase web-app variables:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

### Railway + Render

- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `FRONTEND_URL`
- `JWT_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_FILE`
- `IMAGEKIT_PRIVATE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- SMTP variables when email delivery is enabled

Secrets must remain server-side. Do not put Gemini, ImageKit private keys,
Firebase service-account JSON, database passwords or JWT secrets into Vite
variables.

## Important limitation

This ZIP cannot prove that your live Railway/Render/Firebase/ImageKit accounts
are reachable without their live deployment environment. Use `/system-status`
after deployment for a safe connection check.

Before calling the marketplace production-ready, still add/test payment
gateway webhooks, complete addresses, comprehensive integration/security tests,
rate limiting, audit logging and production SMTP.
