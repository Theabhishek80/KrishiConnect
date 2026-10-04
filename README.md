# KrishiConnect

A full-stack farm-to-home marketplace built with **React + Spring Boot + PostgreSQL**.

## What is included

- Modern responsive React marketplace UI
- Consumer and Farmer registration
- JWT access tokens + rotating refresh tokens
- Forgot password + email reset flow
- Farmer product submission and inventory
- Admin product approval workflow
- Persistent shopping cart
- Transactional checkout and stock deduction
- PostgreSQL + Flyway migrations
- Role-based Spring Security
- Swagger/OpenAPI
- Docker Compose with PostgreSQL + MailHog for local password-reset testing

> **Start with [SETUP.md](SETUP.md)** – the Firebase / Gemini / env checklist.

## Run locally

1. Start infrastructure:
   `docker compose up -d postgres mailhog`
2. Start backend from `backend` with Java 21 and Maven.
3. Start frontend:
   `cd frontend`
   `npm install`
   `npm run dev`

Frontend defaults to `http://localhost:5173`.
Backend defaults to `http://localhost:8080`.

### Environment variables

Backend:
- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET` (use a long random secret in production)
- `FRONTEND_URL`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS`
- `MAIL_FROM`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`

Frontend:
- `VITE_API_BASE_URL`

For local password-reset testing with Docker Compose, MailHog is available at `http://localhost:8025`.

## Production notes

- Replace all development secrets.
- Use a managed PostgreSQL database.
- Configure a real SMTP provider for password reset.
- Set the exact Vercel frontend URL in `FRONTEND_URL`.
- Set `VITE_API_BASE_URL` to the deployed Spring Boot API URL.
- Add HTTPS and restrict CORS to the production frontend only.
