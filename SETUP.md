# KrishiConnect – setup checklist

Login, Register and Google sign-in all depend on **Firebase being configured on
BOTH sides**. If any item below is missing, those features fail. Work through it
top to bottom.

## 1. Firebase console (one time)
1. **Authentication → Sign-in method**: enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains**: add every address the site
   runs on (`localhost` is there by default; add `kisandirect.online`,
   `www.kisandirect.online`, your `*.vercel.app` address).
   *Missing domain = "Google sign-in does not work" on the live site.*
3. **Project settings → General → Your apps → Web app**: copy the config values.
4. **Project settings → Service accounts → Generate new private key**: downloads a
   JSON file for the backend.

## 2. Backend (Spring Boot)
Put these in `.env` (project root) for local runs, or as environment variables on
Railway / Render:

| Variable | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | whole service-account JSON on one line (or use `FIREBASE_SERVICE_ACCOUNT_FILE=path/to/file.json`) |
| `GEMINI_API_KEY` | your Gemini key (already placed in the local `.env`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | the admin login (see section 5) |
| `JWT_SECRET` | any random string, 32+ characters |
| `FRONTEND_URL` | allowed website origins, comma separated |
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | PostgreSQL |
| `IMAGEKIT_PRIVATE_KEY` | needed only to upload ad / recipe / product images |

Start: `docker compose up -d postgres mailhog`, then in `backend/`: `mvn spring-boot:run`.

Open `http://localhost:8080/api/status`. It reports safe booleans for
`databaseReachable`, `firebaseConfigured`, `aiConfigured` and
`imageKitConfigured`.

## 3. Frontend (React)
Copy `frontend/.env.example` to `frontend/.env`, fill in the `VITE_FIREBASE_*`
values, then `npm install` and `npm run dev`. Leave `VITE_API_BASE_URL` empty
locally – the Vite proxy sends `/api` to the backend.

## 4. Vercel (production)
Set `VITE_FIREBASE_*`, `VITE_API_BASE_URL=/api`, and
`PRIMARY_BACKEND_URL` (Railway). Set `BACKUP_BACKEND_URL` to Render if you
want read-request failover. The backup variable is optional. Redeploy after
changing environment variables.

## 5. Admin account
The admin is created automatically from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
Sign in on the normal Login page with that e-mail and password – it works even
though the admin has no Firebase account.

## 6. Recipes
Admin panel → **Recipes** tab: post, edit, hide or delete recipes. The six
original recipes were copied into the database automatically (migration V7).

## 7. Mandi rates
Shows a "Coming soon" page at `/mandi` until a price API is available.

## Security notes
* Never put the Gemini key in frontend code. It lives only on the server.
* `.env` is git-ignored. Do not commit it or share screenshots of keys.
* Treat any API key that has ever been pasted into a public chat, screenshot,
commit or log as replaceable. Rotate it in the provider dashboard if needed,
then update only the backend/host environment variable.
