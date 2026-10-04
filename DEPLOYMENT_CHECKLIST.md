# KrishiConnect deployment checklist

## 1. Railway — primary backend

Set:

- DATABASE_URL
- DATABASE_USERNAME
- DATABASE_PASSWORD
- FRONTEND_URL=https://YOUR-DOMAIN
- JWT_SECRET
- FIREBASE_SERVICE_ACCOUNT_JSON
- IMAGEKIT_PRIVATE_KEY
- GEMINI_API_KEY
- GEMINI_MODEL=gemini-flash-latest
- SMTP variables if email is enabled

Then open:

`https://YOUR-RAILWAY-BACKEND/api/status`

Expected:

- `ok: true`
- `databaseReachable: true`
- `firebaseConfigured: true`
- `aiConfigured: true`
- `imageKitConfigured: true`

## 2. Render — backup backend

Use the same database/auth/AI/ImageKit variables as Railway.

Use the same `FRONTEND_URL`.

Check:

`https://YOUR-RENDER-BACKEND/api/status`

## 3. Vercel — frontend

Set:

- VITE_API_BASE_URL=/api
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- PRIMARY_BACKEND_URL=https://YOUR-RAILWAY-BACKEND
- BACKUP_BACKEND_URL=https://YOUR-RENDER-BACKEND

Redeploy after changing variables.

## 4. Firebase

Enable Email/Password and Google sign-in.

Add your production domain and Vercel domain to Firebase Authorized Domains.

The backend needs the Firebase service-account JSON; the frontend needs only the Firebase Web App config.

## 5. ImageKit

Only the backend needs:

`IMAGEKIT_PRIVATE_KEY`

Never put the ImageKit private key in Vercel/Vite variables.

## 6. Gemini

Only the backend needs:

`GEMINI_API_KEY`

The frontend calls `/api/ai/chat`; it never receives the Gemini key.

## 7. Direct page URLs

After deployment, test:

- `/`
- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/profile`
- `/cart`
- `/farmer`
- `/admin`
- `/admin/overview`
- `/admin/approvals`
- `/admin/products`
- `/admin/recipes`
- `/admin/advertisements`
- `/recipes`
- `/blog`
- `/mandi`
- `/kisandirect-ai`
- `/system-status`

Refresh each URL directly. Vercel should return the React app instead of a 404.

## Important

Do not upload `.env` files containing secrets. The repaired ZIP intentionally contains environment examples only.
