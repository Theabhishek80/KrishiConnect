# KrishiConnect

A modular monolith farmer-to-consumer marketplace.

## Stack

- Backend: Java 21, Spring Boot 3.5, Spring Security, JWT, JPA, Flyway, PostgreSQL
- Frontend: React + Vite + React Router + Axios
- Infrastructure: Docker Compose, PostgreSQL
- Payment: Mock provider abstraction (ready for Razorpay/Stripe/PayU adapter)
- Email: Spring Mail / MailHog in development

## Repository layout

backend/   Spring Boot REST API
frontend/  React SPA
docker-compose.yml
.env.example

## Local development

### Backend

Create PostgreSQL and configure environment variables from `.env.example`.

```bash
cd backend
mvn spring-boot:run
```

API: `http://localhost:8080`
Swagger: `http://localhost:8080/swagger-ui.html`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Set `VITE_API_BASE_URL=http://localhost:8080/api`.

### Docker

```bash
docker compose up --build
```

The compose file starts PostgreSQL, MailHog and the backend. Run the frontend separately with Vite or deploy it to a static host.

## Production deployment

Deploy backend and frontend separately if desired.

Backend environment:
- DATABASE_URL
- DATABASE_USERNAME
- DATABASE_PASSWORD
- JWT_SECRET
- FRONTEND_URL
- MAIL_HOST
- MAIL_PORT
- MAIL_USERNAME
- MAIL_PASSWORD

Frontend environment:
- VITE_API_BASE_URL

Never commit real secrets.

## Demo admin

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` through environment variables. The application seeds the admin on startup if absent.

## Important

This project deliberately uses a mock payment provider. No real money is processed. Replace the provider implementation with a verified payment gateway adapter before production payments.
