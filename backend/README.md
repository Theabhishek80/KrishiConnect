# KrishiConnect Backend

Spring Boot 3.5 / Java 21 API with PostgreSQL/Flyway.

## Production environment

Set these on both Railway (primary) and Render (backup):

- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `FRONTEND_URL`
- `JWT_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_FILE`
- `IMAGEKIT_PRIVATE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- SMTP variables if email is enabled

Never put Gemini, ImageKit private keys, Firebase service-account JSON,
database passwords or JWT secrets in the React/Vercel environment.

## Diagnostics

`GET /api/status` reports safe booleans for PostgreSQL, Firebase, Gemini and
ImageKit configuration. It never returns credentials.

## API docs

`/swagger-ui.html`
