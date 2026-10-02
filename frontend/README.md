# KisanDirect Frontend

React + Vite frontend for KisanDirect.

## Production
Set these Vercel environment variables:

- `VITE_API_BASE_URL=/api`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `PRIMARY_BACKEND_URL`
- `BACKUP_BACKEND_URL`

The `/api/*` Vercel function proxies requests to the primary backend and can fail over to the backup backend according to its existing safety rules.
