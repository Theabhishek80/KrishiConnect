# KrishiConnect Backend

Spring Boot 3.5 / Java 21 API.

## Main modules

- `controller` — HTTP endpoints
- `service` — business logic
- `repository` — JPA repositories
- `entity` — database entities
- `security` — JWT authentication and authorization
- `dto` — validated request/response models
- `db/migration` — Flyway schema migrations

## Authentication

`POST /api/auth/register`
`POST /api/auth/login`
`POST /api/auth/refresh`
`POST /api/auth/forgot-password`
`POST /api/auth/reset-password`

Password reset emails are sent through Spring Mail. The included Docker Compose file uses MailHog for local development.

## API documentation

When running locally:
`/swagger-ui.html`
