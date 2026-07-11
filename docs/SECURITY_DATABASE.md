# Security & Database Architecture

This guide describes how stateless user authentication, multi-tier PWA session persistence, CORS protection, role checks, and database schemas are implemented in the Opportunity Management Platform (OMP).

---

## 🔒 1. Security Architecture

Our security configuration is managed by Spring Security and JJWT.

### Security Configurations (`SecurityConfig.java`)
We disable traditional server-side state components and configure a completely stateless filter chain:
-   **Session Policy**: `SessionCreationPolicy.STATELESS`. The server does not maintain session records or allocate cookies for tracking. Every request must be authenticated via its cryptographic token.
-   **HTTP Basic/Form Login**: Disabled (`httpBasic` and `formLogin`). All login attempts are handled via JSON POST requests to `AuthController.java` or through OAuth redirects.
-   **CSRF Protection**: Disabled. Because the JWT token is not automatically sent by the browser in cookie headers (it must be manually injected via the client request interceptor's `Authorization: Bearer` header), the application is protected against Cross-Site Request Forgery (CSRF) by design.
-   **CORS (Cross-Origin Resource Sharing)**: Restricts incoming requests to explicit whitelisted origins (e.g. `http://localhost:5173` in development and your verified production Vercel frontend domain).

### Role Permissions & Actuator Hardening
-   **Public Endpoints**: `/api/auth/login`, `/api/auth/register`, `/oauth2/**`, `/login/oauth2/**`, and `/actuator/health` are open to everyone.
-   **Protected API Endpoints**: `/api/**` require authenticated JWT authorization.
-   **System Actuator Endpoints**: `/actuator/**` (except `/health`) are restricted to the `ADMIN` role to prevent info leaks.

---

## 🔑 2. JWT Configuration & Token Provider

### Token Generation & Validation (`JwtTokenProvider.java`)
JWT tokens are generated, signed, and validated locally by the `JwtTokenProvider` class:
-   **Signing Key**: We sign tokens with **HMAC SHA-512 (HS512)**. We enforce a startup check to ensure that `jwtSecret` is a cryptographically strong string of at least **64 bytes** (512 bits). If the key is weak or missing, the application halts.
-   **JWT Expiration (15 Days)**:
    Set via properties to **`1296000000` ms** (15 days). This gives users a persistent session without forcing logins every 30 minutes.

### Authentication Filtering (`JwtAuthenticationFilter.java`)
This filter intercepts every incoming request before it reaches Spring Security's controllers:
1.  Extracts the `Authorization` header.
2.  Checks for a `Bearer ` prefix and extracts the token string.
3.  Validates the token's cryptographic signature against the signing key.
4.  Decrypts the claims (`userId`, `email`).
5.  Queries the database for the user's records, creates a `UsernamePasswordAuthenticationToken` context, and inserts it into Spring Security's thread-local `SecurityContextHolder`.

---

## 🗄️ 3. Database Schema

We use **H2 (In-Memory)** for development and **PostgreSQL** in production. The connection credentials and validation flags are loaded from the active profile config (`application-dev.yml` vs `application-prod.yml`).

### Entity Relationships
-   **User <-> UserProfile (1:1)**: A user has exactly one profile specifying personal information.
-   **User <-> Application (1:N)**: A user can track multiple event applications.
-   **User <-> Placement (1:N)**: A user can track multiple job placements.
-   **Cascade Policy**: All child records (profiles, applications, placements) use `ON DELETE CASCADE` so deleting a user account clears all their data automatically.

### Database Tables Structure (`schema.sql`)
```sql
-- Users Table: Core credentials
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER'
);

-- User Profiles Table: Extended personal details
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    full_name VARCHAR(255),
    location VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications Table: Event tracking log
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    status VARCHAR(100) NOT NULL,
    deadline TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Placements Table: Placement pipelines and AI extracts
CREATE TABLE IF NOT EXISTS placements (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    status VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
