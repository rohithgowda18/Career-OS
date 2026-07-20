# Backend Services & APIs Guide

This document describes the Spring Boot architecture, service layers, and configuration details for the Career OS backend.

---

## 🛠️ 1. Core Technology Stack
-   **Java 17/21**: Object-oriented application execution.
-   **Spring Boot 3.2**: Rapid application configuration and deployment starter.
-   **Spring Security**: Handles stateless token authorization and security filters.
-   **Spring Data JPA / Hibernate**: Automatically maps Java classes to database schemas.
-   **JJWT (JSON Web Token)**: Enforces signed HS512 cryptographic verification.
-   **Gemini Client (Google AI SDK)**: Links the application with `gemini-2.5-flash` model for AI operations.

---

## 📂 2. Directory and Package Structure
The backend codebase lives under `apps/backend/src/main/java/com/eventtracker//`:
```
com.eventtracker/
├── controller/         # REST API Handlers exposing endpoints
│   ├── ApplicationController.java   # Applications CRUD & text ingestion
│   ├── AuthController.java          # Login, Registration, & Session retrieval (w/ Display Name updates)
│   ├── PlacementController.java     # Placements CRUD & AI extraction endpoints
│   ├── SkillController.java         # Skills CRUD endpoints
│   ├── ImportController.java        # Process raw CSV data imports
├── dto/                # Data Transfer Objects sanitizing API payloads
├── entity/             # Hibernate JPA database definitions (User, Profile, Skill, Placement)
├── repository/         # Data access interfaces mapping SQL actions
├── security/           # Spring Security, filters, & Jwt providers
│   ├── JwtAuthenticationFilter.java  # Request authorization filter
│   ├── JwtTokenProvider.java          # Cryptographic JWT helpers
│   ├── SecurityConfig.java            # CORS & endpoint permissions
│   └── oauth/                         # OAuth2 login success callbacks
├── service/            # Business validation logic
│   ├── AnalyticsService.java          # Aggregate conversion metrics & acceptance yields
│   ├── ApplicationService.java        # Core application CRUD logic
│   ├── PlacementService.java          # Core placement tracking logics
│   ├── SkillService.java              # Skills category and level adjustments
│   ├── GeminiExtractionService.java   # Generative AI extraction service
│   ├── ImportService.java             # Parsing & batching user CSV imports
├── util/               # Shared utilities
│   ├── UrlUtils.java                  # Common domain-parsing and normalization helpers
└── EventAppTrackerApplication.java     # Application entrypoint
```

---

## 🏗️ 3. Decoupled Request Workflow
Career OS strictly uses the N-Tier layered design pattern. An incoming request moves through the following layers:
```
[Client Request] ──> [Controller] ──> [DTO] ──> [Service] ──> [Repository] ──> [Database]
```
1.  **Controller Layer**: Validates HTTP constraints. For example, text inputs to the AI extraction endpoints are capped at a maximum of 10,000 characters to prevent request exhaustion.
2.  **DTO (Data Transfer Object)**: Maps request bodies to specific, clean Java inputs. Prevents accidental database updates by isolating raw JPA entity objects.
3.  **Service Layer**: Executes validations and business rules.
4.  **Repository Layer**: Translates actions into queries mapping the database.
5.  **Entity**: Restores or persists Java models directly as relational data.

---

## 🤖 4. Gemini AI Placement Extraction Service

The backend utilizes `GeminiExtractionService.java` to process unstructured copy-pasted texts (such as email offers, application confirmations, or job boards) and extract clean database models.

-   **Model**: Google Gemini `gemini-2.5-flash`.
-   **Prompt Schema**: Enforces structured JSON output. We define a JSON schema constraint so the AI agent outputs exactly:
    ```json
    {
      "company": "Company Name",
      "role": "Job Title/Role Name",
      "status": "Applied | Assessment Scheduled | Interview Scheduled | Offer Received",
      "deadline": "YYYY-MM-DDTHH:mm:ss"
    }
    ```
-   **Processing**: If the LLM successfully parses the input text, the values are returned as an `ExtractionResultDTO` and instantly mapped into the user's `Placement` repository.

---

## 📡 5. REST API Specifications

All endpoints (except login, register, and health checks) require the header `Authorization: Bearer <JWT>`.

| Method | Endpoint | Description | Auth Scope |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Create a new user account (saving displayName) | Public |
| **POST** | `/api/auth/login` | Login and receive a 15-day JWT token | Public |
| **PUT** | `/api/auth/me/display-name` | Update display name properties | User JWT |
| **GET** | `/api/auth/me` | Fetch active user information | User JWT |
| GET | `/api/applications` | List event applications with optional status and event type filtering | User JWT |
| **POST** | `/api/applications` | Create a tracking application record | User JWT |
| **PUT** | `/api/applications/{id}` | Update an application's details | User JWT |
| **DELETE** | `/api/applications/{id}` | Delete an application | User JWT |
| **GET** | `/api/skills` | List user professional skills | User JWT |
| **POST** | `/api/skills` | Create a new skill record | User JWT |
| **PUT** | `/api/skills/{id}` | Update skill level configurations | User JWT |
| **DELETE** | `/api/skills/{id}` | Remove a skill entry | User JWT |
# Backend Services & APIs Guide

This document describes the Spring Boot architecture, service layers, and configuration details for the Career OS backend.

---

## 🛠️ 1. Core Technology Stack
-   **Java 17/21**: Object-oriented application execution.
-   **Spring Boot 3.2**: Rapid application configuration and deployment starter.
-   **Spring Security**: Handles stateless token authorization and security filters.
-   **Spring Data JPA / Hibernate**: Automatically maps Java classes to database schemas.
-   **JJWT (JSON Web Token)**: Enforces signed HS512 cryptographic verification.
-   **Gemini Client (Google AI SDK)**: Links the application with `gemini-2.5-flash` model for AI operations.

---

## 📂 2. Directory and Package Structure
The backend codebase lives under `apps/backend/src/main/java/com/eventtracker//`:
```
com.eventtracker/
├── controller/         # REST API Handlers exposing endpoints
│   ├── ApplicationController.java   # Applications CRUD & text ingestion
│   ├── AuthController.java          # Login, Registration, & Session retrieval (w/ Display Name updates)
│   ├── PlacementController.java     # Placements CRUD & AI extraction endpoints
│   ├── SkillController.java         # Skills CRUD endpoints
│   ├── ImportController.java        # Process raw CSV data imports
├── dto/                # Data Transfer Objects sanitizing API payloads
├── entity/             # Hibernate JPA database definitions (User, Profile, Skill, Placement)
├── repository/         # Data access interfaces mapping SQL actions
├── security/           # Spring Security, filters, & Jwt providers
│   ├── JwtAuthenticationFilter.java  # Request authorization filter
│   ├── JwtTokenProvider.java          # Cryptographic JWT helpers
│   ├── SecurityConfig.java            # CORS & endpoint permissions
│   └── oauth/                         # OAuth2 login success callbacks
├── service/            # Business validation logic
│   ├── AnalyticsService.java          # Aggregate conversion metrics & acceptance yields
│   ├── ApplicationService.java        # Core application CRUD logic
│   ├── PlacementService.java          # Core placement tracking logics
│   ├── SkillService.java              # Skills category and level adjustments
│   ├── GeminiExtractionService.java   # Generative AI extraction service
│   ├── ImportService.java             # Parsing & batching user CSV imports
├── util/               # Shared utilities
│   ├── UrlUtils.java                  # Common domain-parsing and normalization helpers
└── EventAppTrackerApplication.java     # Application entrypoint
```

---

## 🏗️ 3. Decoupled Request Workflow
Career OS strictly uses the N-Tier layered design pattern. An incoming request moves through the following layers:
```
[Client Request] ──> [Controller] ──> [DTO] ──> [Service] ──> [Repository] ──> [Database]
```
1.  **Controller Layer**: Validates HTTP constraints. For example, text inputs to the AI extraction endpoints are capped at a maximum of 10,000 characters to prevent request exhaustion.
2.  **DTO (Data Transfer Object)**: Maps request bodies to specific, clean Java inputs. Prevents accidental database updates by isolating raw JPA entity objects.
3.  **Service Layer**: Executes validations and business rules.
4.  **Repository Layer**: Translates actions into queries mapping the database.
5.  **Entity**: Restores or persists Java models directly as relational data.

---

## 🤖 4. Gemini AI Placement Extraction Service

The backend utilizes `GeminiExtractionService.java` to process unstructured copy-pasted texts (such as email offers, application confirmations, or job boards) and extract clean database models.

-   **Model**: Google Gemini `gemini-2.5-flash`.
-   **Prompt Schema**: Enforces structured JSON output. We define a JSON schema constraint so the AI agent outputs exactly:
    ```json
    {
      "company": "Company Name",
      "role": "Job Title/Role Name",
      "status": "Applied | Assessment Scheduled | Interview Scheduled | Offer Received",
      "deadline": "YYYY-MM-DDTHH:mm:ss"
    }
    ```
-   **Processing**: If the LLM successfully parses the input text, the values are returned as an `ExtractionResultDTO` and instantly mapped into the user's `Placement` repository.

---

## 📡 5. REST API Specifications

All endpoints (except login, register, and health checks) require the header `Authorization: Bearer <JWT>`.

| Method | Endpoint | Description | Auth Scope |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Create a new user account (saving displayName) | Public |
| **POST** | `/api/auth/login` | Login and receive a 15-day JWT token | Public |
| **PUT** | `/api/auth/me/display-name` | Update display name properties | User JWT |
| **GET** | `/api/auth/me` | Fetch active user information | User JWT |
| GET | `/api/applications` | List event applications with optional status and event type filtering | User JWT |
| **POST** | `/api/applications` | Create a tracking application record | User JWT |
| **PUT** | `/api/applications/{id}` | Update an application's details | User JWT |
| **DELETE** | `/api/applications/{id}` | Delete an application | User JWT |
| **GET** | `/api/skills` | List user professional skills | User JWT |
| **POST** | `/api/skills` | Create a new skill record | User JWT |
| **PUT** | `/api/skills/{id}` | Update skill level configurations | User JWT |
| **DELETE** | `/api/skills/{id}` | Remove a skill entry | User JWT |
| **GET** | `/api/placements` | List placement entries with optional status filtering | User JWT |
| **POST** | `/api/placements` | Create a placement entry | User JWT |
| **PUT** | `/api/placements/{id}` | Update a placement entry | User JWT |
| **DELETE** | `/api/placements/{id}` | Delete a placement entry | User JWT |
| **POST** | `/api/placements/extract` | Extract placement data from text using Gemini | User JWT |
| **POST** | `/api/import/text` | Classify and import unstructured content using Gemini AI | User JWT |
| **GET** | `/api/analytics/dashboard` | Fetch compiled analytics and Conversion Yields | User JWT |
| **GET** | `/actuator/health` | Service status checks (used for cold-start wakeups) | Public |
| **GET** | `/actuator/**` | System metrics & debugging logs | Admin Only |

---

## 🔍 6. Server-Side Filtering Architecture & Database Query Deep-Dive

To support scalable and highly responsive filtering on tracking resources (Applications and Placements) without complicating code maintainability, the backend employs a dynamic SQL generation pattern through Spring Data JPA and Hibernate.

### A. The Null-Evaluation JPQL Short-Circuit Mechanism
To avoid repository-method explosion (i.e. having to write permutations like `findByUserIdAndStatus`, `findByUserIdAndEventType`, `findByUserIdAndStatusAndEventType`), Career OS uses JPQL logical OR conditions with parameter null-checking.

#### 1. Applications JPQL Query Structure
```java
@Query("SELECT a FROM Application a WHERE a.user.id = :userId " +
       "AND (:status IS NULL OR a.status = :status) " +
       "AND (:eventType IS NULL OR a.eventType = :eventType)")
Page<Application> findFiltered(
    @Param("userId") Long userId,
    @Param("status") Application.ApplicationStatus status,
    @Param("eventType") Application.EventType eventType,
    Pageable pageable
);
```

#### 2. Placements JPQL Query Structure
```java
@Query("SELECT p FROM Placement p WHERE p.user.id = :userId " +
       "AND (:status IS NULL OR p.status = :status)")
Page<Placement> findFiltered(
    @Param("userId") Long userId, 
    @Param("status") PlacementStatus status, 
    Pageable pageable
);
```

#### ⚙️ Internal Database Execution Mechanics
When a repository call is issued, Hibernate passes the JPQL expression to its AST (Abstract Syntax Tree) parser to generate target SQL:

1. **Parameter Binding:** Optional values from the HTTP Request (e.g. `status` or `eventType`) are mapped to parameters `:status` and `:eventType`. If a filter is unselected, the frontend sends a query parameter which resolves to `null`.
2. **Boolean Short-Circuiting:** 
   * Hibernate binds the parameter value. If the value is `null`, the condition `:status IS NULL` evaluates to `TRUE`.
   * In standard SQL Boolean algebra: `TRUE OR <expression>` always yields `TRUE` regardless of the value of `<expression>`.
   * Database query optimizer engines (e.g. PostgreSQL, H2) detect this static `TRUE` value at compile-time and prune the logical branch, completely bypassing comparisons on `a.status`.
3. **Execution Plan Efficiency:** By bypassing unselected branches, database engines execute index-scans on the foreign key columns (`user_id`) without performing costly column comparisons, maintaining `O(log N)` complexity.

---

### B. Controller Request Mapping & Spring Core Bindings
1. **Request Dispatching:** The Spring Boot `DispatcherServlet` intercepts requests on `/api/applications` or `/api/placements`.
2. **Param Resolution:** `@RequestParam(required = false) String status` checks the URL query string.
   * If parameter key is absent, Spring binds a Java `null` value.
   * If parameter key is present (e.g. `?status=Applied`), it binds the corresponding `String`.
3. **Service Layer Parsing & Normalization:**
   * Text inputs are sanitized by removing whitespace (`status.trim().replaceAll(" ", "")`).
   * Displays like `"In Review"` from the UI map to the normalized string `"InReview"`.
   * Enums are validated against internal static constants. Any invalid values are parsed safely using fallback defaults (e.g. `ApplicationStatus.Interested`).
   * When `"ALL"` is passed as a string, the services set the parsed enum target to `null`, allowing the database's `:param IS NULL` short-circuit to execute.
4. **Stable Secondary Sorting Enforcement:**
   * Spring Data JPA's `Pageable` captures sorting parameters (e.g., `deadline,asc` or `id,desc`).
   * To prevent pagination drift (records moving between pages due to identical values in the primary sort key), `ApplicationService.java` dynamically alters the sorting configuration:
     ```java
     Sort sort = pageable.getSort();
     if (sort.isSorted()) {
         if (sort.getOrderFor("id") == null) {
             sort = sort.and(Sort.by(Sort.Direction.ASC, "id"));
         }
     } else {
         sort = Sort.by(Sort.Direction.ASC, "deadline").and(Sort.by(Sort.Direction.ASC, "id"));
     }
     ```
   * This guarantees consistent pagination offsets.

---

### C. Database Security Scope Enforcement
To prevent security leaks, all dynamic filter queries strictly bind the authenticated user's ID as the primary index key (`a.user.id = :userId` and `p.user.id = :userId`).
* The `userId` is extracted on the server from the signed JWT payload.
* This ensures that even if a malicious user alters request parameters, they can never query or filter another user's private application or placement records.

---

### D. Placement Search Clean-up & Performance Gains
During the database architectural audit:
* The previous implementation utilized dynamic string concatenation matching:
  `LOWER(p.companyName) LIKE LOWER(CONCAT('%', :search, '%'))`
* This query resulted in full-table scans, as leading wildcards (`%`) disable B-Tree index lookups, forcing sequential scans of the table.
* Since the frontend has no search inputs for placements, we completely removed all search parameter bindings. This optimization eliminated unnecessary CPU execution on the database engine.
