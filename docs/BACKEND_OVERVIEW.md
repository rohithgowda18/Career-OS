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
| **GET** | `/api/applications` | List and search tracking applications | User JWT |
| **POST** | `/api/applications` | Create a tracking application record | User JWT |
| **PUT** | `/api/applications/{id}` | Update an application's details | User JWT |
| **DELETE** | `/api/applications/{id}` | Delete an application | User JWT |
| **GET** | `/api/skills` | List user professional skills | User JWT |
| **POST** | `/api/skills` | Create a new skill record | User JWT |
| **PUT** | `/api/skills/{id}` | Update skill level configurations | User JWT |
| **DELETE** | `/api/skills/{id}` | Remove a skill entry | User JWT |
| **GET** | `/api/placements` | List placement entries | User JWT |
| **POST** | `/api/placements` | Create a placement entry | User JWT |
| **PUT** | `/api/placements/{id}` | Update a placement entry | User JWT |
| **POST** | `/api/placements/extract` | Extract placement data from text using Gemini | User JWT |
| **POST** | `/api/import/csv` | Batch import data from a CSV file | User JWT |
| **GET** | `/api/analytics/dashboard` | Fetch compiled analytics and Conversion Yields | User JWT |
| **GET** | `/actuator/health` | Service status checks (used for cold-start wakeups) | Public |
| **GET** | `/actuator/**` | System metrics & debugging logs | Admin Only |
