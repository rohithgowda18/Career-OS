# Backend Architecture & Rationale (Spring Boot)

This document provides a senior-level technical specification of the Event Application Tracker backend, detailing the **Architectural Approaches**, **Core Tools**, and the **Engineering Rationale** behind every decision.

---

## 🏗️ 1. Architectural Philosophy: The N-Tier Pattern
The backend implements a strict **N-Tier (Layered) Architecture**:
-   **Approach**: Separation of concerns into `Controller`, `Service`, and `Repository` layers.
-   **Why**: 
    -   **Maintainability**: Changes to the database schema (Repository) don't affect the HTTP interface (Controller).
    -   **Testability**: Service logic can be unit tested in isolation using Mockito.
    -   **Persistence Layer**: Spring Data JPA repositories with SQL Script Initialization (`schema.sql`).
    -   **Consistency**: A standardized pattern makes the codebase predictable for new developers.

---

## 📊 2. Data Modeling & Persistence

### Relational Strategy (PostgreSQL + Hibernate)
-   **Approach**: Highly normalized relational schema with strict foreign key constraints.
-   **Tool: Spring Data JPA**:
    -   **Rationale**: We use JPA (Hibernate implementation) to map Java objects to database rows. This abstracts away the complexity of raw JDBC and prevents common issues like SQL injection.
-   **Tool: Spring Boot SQL Initialization**: Uses `schema.sql` to define indices, foreign keys, and unique constraints explicitly.

### Entities Detail
1.  **`User`**: Implements Spring Security's `UserDetails`. Centralizes identity.
2.  **`Application`**: Features a **Unique Constraint** on `(user_id, event_url)`.
    -   **Rationale**: This prevents a user from tracking the same event multiple times, ensuring data cleanliness at the database level.
3.  **`UserProfile`**: Linked via `@OneToOne`.
    -   **Rationale**: We separate "Account Data" (User) from "Personal Data" (Profile) to optimize query performance and enhance privacy controls.
4.  **`Placement`**: Represents job and internship tracking records. Features a multi-column **Unique Index** on `(user_id, company_name, role, application_link)`.
    -   **Rationale**: Restricts data entry duplicates at the database layer while accommodating situations where a candidate applies to different roles at the same company.

---

## 🛠️ 3. Core Service Logic

### URL Normalization Approach
-   **Implementation**: `ApplicationService.normalizeUrl()`.
-   **Rationale**: URLs are notoriously messy (UTM parameters, trailing slashes, protocol differences). By normalizing every URL before storage, we ensure that our "Unique Constraint" works effectively across different variations of the same link.

### Enum Strategy
-   **Approach**: Database storage as `STRING`.
-   **Rationale**: While `ORDINAL` is more compact, `STRING` is human-readable and resilient to changes in enum order, making database debugging significantly easier.

### AI-Assisted Extraction (Gemini integration)
-   **Implementation**: `GeminiExtractionService.java`.
-   **Model**: Defaults to `gemini-2.5-flash`.
-   **Rationale**: Allows users to paste recruitment emails to auto-fill job fields, minimizing manual entry friction.
-   **Technical Rationale**:
    -   *Reflection-driven prompt*: The service inspects `PlacementDTO` properties dynamically using reflection to build the instructions schema.
    -   *Strict JSON enforce*: Uses Gemini's `responseMimeType: "application/json"` parameters to ensure the model responds with structured, parseable schema elements.
    -   *URL Preservation*: Matches parsed URLs from the prompt response back against raw regex-extracted URLs from the original text to guarantee URL integrity.
    -   *Fault Tolerance*: Employs a 3-attempt exponential backoff retry wrapper to handle transient Network or Rate Limit failures.

### Email Notification System
-   **Implementation**: `EmailService.java`.
-   **Mechanism**: Uses Spring's `JavaMailSender` configured via SMTP.
-   **Rationale**: Delivers status transition alerts and weekly digests to help users stay on top of upcoming calendar deadlines.

---

## 📡 4. API Specification & DTO Pattern

### The DTO (Data Transfer Object) Approach
-   **Implementation**: `ApplicationDTO`, `PlacementDTO`, `AuthDTO`, etc.
-   **Why**: We **never** expose internal JPA entities directly to the API.
-   **Security**: Prevents sensitive fields (like passwords or internal IDs) from leaking.
-   **Flexibility**: Allows the API contract to remain stable even if the underlying database schema changes.

### Key API Endpoints
| Endpoint | Method | Logic |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticates credentials and issues a JWT. |
| `/api/applications` | `POST` | Validates, normalizes, and stores new application records. |
| `/api/placements` | `POST` | Processes, validates, and stores job/internship applications. |
| `/api/placements/extract` | `POST` | Interfaces with Gemini API to extract DTO details from raw email text. |
| `/api/analytics/summary` | `GET` | Aggregates event totals, success rates, and category statistics. |
| `/api/placements/analytics` | `GET` | Computes conversion rates (Applied → Assessment → Interview → Offer). |

---

## 🛡️ 5. Security Rationale
-   **Approach**: **Stateless JWT**.
-   **Why**: Standard HTTP sessions require "Sticky Sessions" or a shared session store (like Redis) which adds complexity. JWTs are self-contained, allowing the backend to scale horizontally effortlessly.
-   **Signature Logic**: Uses **HS512** with a minimum 64-byte key check at startup (`@PostConstruct`) to ensure production-grade security defaults.
