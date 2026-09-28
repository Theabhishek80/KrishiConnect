# KrishiConnect API

Run:

```bash
mvn clean test
mvn spring-boot:run
```

Requires PostgreSQL. Flyway creates the schema automatically.

Swagger:
`/swagger-ui.html`

The backend uses JWT access tokens, BCrypt passwords, role-based endpoint authorization,
JPA/Hibernate and optimistic-locking inventory.
