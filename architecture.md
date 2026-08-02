# SYSTEM ARCHITECTURE DOCUMENT — CAREER OS

## 1. HIGH-LEVEL OVERVIEW

Career OS is built as a decoupled, multi-tier client-server architecture:

```
+-----------------------------------------------------------------------+
|                            PRESENTATION TIER                          |
|  React 19 + TypeScript + Vite + Wouter + TanStack React Query          |
|  Tailwind CSS v4 + Radix UI + Lucide Icons + Framer Motion             |
+-----------------------------------┬-----------------------------------+
                                    │
                                    │ HTTPS / JSON REST API
                                    │ Authorization: Bearer <JWT>
                                    ▼
+-----------------------------------------------------------------------+
|                            APPLICATION TIER                           |
|  Spring Boot 3.2.3 (Java 17) REST API                                 |
|                                                                       |
|  ┌───────────────────────┐ ┌───────────────────────┐ ┌─────────────┐  │
|  │ Spring Security Chain │ │ Controller Layer      │ │ Actuator    │  │
|  │  - CORS Filter        │ │  - Request DTOs       │ │ Health      │  │
|  │  - JWT Filter         │ │  - Validation (@Valid)│ │ Monitoring  │  │
|  │  - OAuth2 Success     │ │                       │ │             │  │
|  └───────────┬───────────┘ └───────────┬───────────┘ └─────────────┘  │
|              │                         │                              |
|              ▼                         ▼                              |
|  ┌─────────────────────────────────────────────────────────────────┐  │
|  │ Service Layer (Domain Logic)                                    │  │
|  │  - ApplicationService     - PlacementService                    │  │
|  │  - RoutineService         - SkillService                        │  │
|  │  - AnalyticsService       - GeminiExtractionService             │  │
|  └─────────────────────────────┬───────────────────────────────────┘  │
+----------------────────────────┼────────────────────────────────------+
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
+---------------------------------+ +-----------------------------------+
|        DATA PERSISTENCE         | |          EXTERNAL SERVICES        |
|  PostgreSQL 15 Database         | |  Google Gemini AI API             |
|  Spring Data JPA / Hibernate    | |  Spring Mail (SMTP)               |
+---------------------------------+ +-----------------------------------+
```

---

## 2. COMPONENT DEEP DIVE

### 2.1 Presentation Tier (`apps/web`)
- **Single Page Application**: Handled via Vite compilation and Wouter router.
- **Async Data Hydration**: `@tanstack/react-query` acts as the cache management layer. API responses are cached per key (e.g. `['applications']`) and mutated via optimism/invalidation strategies.
- **REST Client (`src/lib/restClient.ts`)**: Custom Axios instance configured with default headers, `baseURL: VITE_API_BASE_URL`, and an automatic request interceptor that injects `Authorization: Bearer ${localStorage.getItem('token')}` into outgoing HTTP requests.

### 2.2 Application Tier (`apps/backend`)
- **Spring Boot Container**: Standard Spring MVC servlet running on embedded Tomcat.
- **Security & Authorization (`com.eventtracker.security`)**:
  - `SecurityConfig.java`: Configures stateless session management (`SessionCreationPolicy.STATELESS`), CORS rules, public vs protected route patterns.
  - `JwtAuthenticationFilter`: Reads `Authorization` header, extracts JWT, parses claims via `JwtTokenProvider`, and constructs `UsernamePasswordAuthenticationToken` inside `SecurityContextHolder`.
  - `OAuth2LoginSuccessHandler`: Intercepts Google/GitHub OAuth2 authentication success, generates custom JWT token for the authenticated user, and redirects to frontend with token parameter.

### 2.3 AI Opportunity Extraction Engine (`GeminiExtractionService`)
- When a user inputs an event or job posting URL, `GeminiExtractionService` performs an HTTP fetch of the target web page HTML content.
- Cleaned text content is injected into a structured Google Gemini API prompt (`gemini-2.5-flash`).
- Gemini extracts and formats standard JSON containing: `eventName`, `eventType`, `companyName`, `role`, `location`, `stipend`, `ctc`, and `deadline`.
- Formatted JSON is returned to the frontend form modal to auto-populate application fields.

### 2.4 Data Tier (`apps/backend/src/main/resources/schema.sql`)
- **PostgreSQL 15**: Relational database engine.
- **JPA & Hibernate**: Object-Relational Mapping (ORM) mapping Java entities (`User`, `Application`, `Placement`, `Skill`, `RoutineTask`, `RoutineCompletion`) to tables.
- **Constraints & Indices**: Foreign keys with `ON DELETE CASCADE` ensure referential integrity; unique composite indices ensure idempotency for saved application links and placement entries.

---

## 3. DEPLOYMENT & CI/CD ARCHITECTURE

```
GitHub Repository (main branch)
       │
       ├──> GitHub Actions (.github/workflows/build.yml)
       │      ├─ Java 17 Maven compile & Vitest frontend check
       │
       ├──> Vercel Deployment (Frontend `apps/web`)
       │      └─ Build command: `npm run build`
       │
       └──> Render Deployment (Backend `apps/backend` & Postgres)
              ├─ Render Docker Service: Dockerfile multi-stage build
              └─ Render PostgreSQL Database Instance
```
