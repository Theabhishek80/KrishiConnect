# What is included

This ZIP is a functional, deployment-oriented KrishiConnect MVP foundation with:

- Spring Boot 3 / Java 21 backend
- PostgreSQL + Flyway
- JWT login/registration
- BCrypt password hashing
- Consumer/Farmer/Admin role authorization
- Public product search/pagination
- Farmer product submission + inventory
- Persistent cart
- Transactional checkout and stock decrement
- Multi-farmer order splitting at the service layer
- Farmer order status updates
- Admin dashboard/user/product/order read APIs
- Notifications data model/API
- React/Vite marketplace, authentication, cart, farmer and admin screens
- Docker Compose for PostgreSQL/MailHog/backend
- Environment-based deployment configuration

## Before calling this "production-ready"

This is not a claim that every commercial marketplace feature is finished. Before taking real orders, add and test:

- full email verification workflow
- full refresh-token rotation and revocation
- password-reset workflow
- real payment gateway adapter and webhook verification
- complete admin approval/rejection UI and APIs
- addresses CRUD and order-address relation
- image upload/storage implementation
- comprehensive order-item persistence and checkout-group persistence
- automated integration/security tests
- rate limiting, audit logging and production CORS policy
- production SMTP/object-storage configuration
- end-to-end deployment smoke tests

No real payment credentials or secrets are included.
