# KrishiConnect Frontend

React + Vite marketplace client.

## Stable routes

`/`, `/about`, `/blog`, `/blog/:slug`, `/recipes`, `/recipes/:slug`,
`/mandi`, `/kisandirect-ai`, `/ai`, `/login`, `/register`, `/verify-email`,
`/forgot-password`, `/reset-password`, `/cart`, `/profile`, `/farmer`,
`/admin`, `/admin/overview`, `/admin/approvals`, `/admin/products`, `/admin/recipes`, `/admin/advertisements`, `/orders`, `/addresses`,
`/settings`, `/system-status`.

Direct navigation to these URLs is supported by the Vercel SPA rewrite.

## Production API

Recommended:

`VITE_API_BASE_URL=/api`

The Vercel `/api/*` gateway forwards to `PRIMARY_BACKEND_URL` (Railway) and
uses `BACKUP_BACKEND_URL` (Render) for safe read-request failover.

Local:

`VITE_API_BASE_URL=http://localhost:8080`

`VITE_PROXY_TARGET=http://localhost:8080`
