# Career OS — Permanent Codebase Memory & Intelligence Dossier

> **File:** `memory.md`  
> **Status:** Ground Truth System Specification  
> **Author:** Senior Staff Software Architect, Reverse Engineer & Codebase Intelligence Agent  
> **Version:** 2.0 (Decoupled Distributed Microservices Architecture)  
> **Last Verified:** 2026-09-16  

---

## 1. Project Overview

### 1.1 What is Career OS?
**Career OS** (previously titled *Event Tracker*) is a high-performance, distributed, cloud-native career command center designed for modern software engineers, computer science students, and tech professionals. It consolidates the fragmented, chaotic components of career growth into an integrated single-pane-of-glass platform:
- **Placement & Job Pipeline Tracking:** Full lifecycle monitoring of corporate applications and internships through pipeline stages (`APPLIED`, `OA_SCHEDULED`, `OA_COMPLETED`, `INTERVIEW_SCHEDULED`, `INTERVIEW_COMPLETED`, `OFFER_RECEIVED`, `REJECTED`), capturing compensation figures (CTC, stipend), online assessment dates, interview timelines, and direct links.
- **Career Events & Hackathons:** Deadline monitoring for competitive programming contests, hackathons, conferences, and career fairs, enforcing idempotency via composite unique indexes.
- **Daily Habit & Preparation Routine Engine:** Daily recurring task manager with calendar day-based completions, streak counters (current and longest streaks), and weekly completion ratios.
- **Skills Portfolio Matrix:** Categorized technical skill directory categorized by domain (`Frontend`, `Backend`, `Database`, `Cloud/DevOps`, `Languages`, `Tools`) and proficiency levels (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`).
- **Generative AI Content Extraction:** Powered by Google's `gemini-2.5-flash` LLM, ingesting unstructured rejection, invitation, or recruitment emails and returning validated JSON objects mapping directly to placement and event entity schemas in sub-2-second latency.
- **Executive Analytics Engine:** Real-time metrics computing interview conversion funnels, timeline trends, offer rates, and preparation consistency.

### 1.2 Why It Exists (Business Problem & User Workflow)
- **Problem:** Job seekers manage recruitment drives across scattered Gmail threads, LinkedIn messages, spreadsheets, Notion pages, and Discord servers. Critical deadlines (Online Assessments, Coding Tests, Interview confirmations) are missed, follow-up timelines blur, and preparation routines (LeetCode, system design) lack consistency.
- **User Workflow:**
  1. **Capture:** A candidate receives a recruiter email or finds a job listing. They paste the raw unstructured text into the Quick Entry dialog.
  2. **Extraction:** The AI Extraction Service parses the text using Google Gemini 2.5 Flash, returning structured metadata (Company, Role, Compensation, Dates, Links).
  3. **Tracking:** The candidate confirms or modifies the data; the record is persisted via the API Gateway into PostgreSQL.
  4. **Preparation & Routine:** The candidate logs daily prep habits (e.g., "1 LeetCode Medium", "Review System Design") and tracks their streak.
  5. **Review & Analytics:** The candidate visualizes upcoming calendar events, Kanban stages, and pipeline conversion analytics.

---

## 2. Technology Stack Detection

| Architectural Layer | Detected Technology | Exact Version / Notes |
| :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.2.1` (Single Page Application via Vite `^7.1.7`) |
| **Frontend Language** | TypeScript | `5.9.3` |
| **Routing** | Wouter | `^3.3.5` (Minimalist router with custom `locationchange` event patching) |
| **Server State Management** | TanStack Query | `^5.90.2` (React Query v5 with cache invalidation) |
| **Styling & Design System** | Tailwind CSS | `^4.1.14` (Tailwind v4 with `@tailwindcss/vite`, CSS Variables) |
| **UI Primitives** | Radix UI | Popover, Dialog, Select, Dropdown, Tabs, Tooltip, Switch, Slider, etc. |
| **Animations & Icons** | Framer Motion & Lucide | `framer-motion ^12.23.22`, `lucide-react ^0.453.0` |
| **PWA Engine** | Vite Plugin PWA & Workbox | `vite-plugin-pwa ^1.2.0`, offline asset caching, auto-update |
| **Backend Framework** | Spring Boot | `3.3.0` / `3.2.0` (Java 17, Spring Web, Spring Data JPA, Spring Security) |
| **Microservice Framework** | Spring Cloud | `2023.0.1` (Spring Cloud Gateway, Eureka Client, OpenFeign) |
| **Service Discovery** | Netflix Eureka Server | Standalone registry running on port `8761` |
| **API Gateway** | Spring Cloud Gateway | Reactive Gateway running on port `8080` (Netty engine) |
| **Authentication Service** | Spring Boot Auth Service | Dedicated microservice running on port `8081` |
| **Core Backend Service** | Spring Boot Resource Server | Business domain service running on port `8085` |
| **AI Extraction Service** | Spring Boot AI Microservice | Dedicated service running on port `8082` |
| **Database** | PostgreSQL | `15-alpine` (`event_tracker_db` & `career_os_auth_db`) |
| **Database Driver / ORM** | PostgreSQL JDBC & Hibernate | Spring Data JPA / Hibernate 6.x |
| **Authentication Protocol** | JWT (HMAC-SHA512) & OAuth2 | Stateless JWTs (15-day expiration), Google & GitHub OAuth2 |
| **External LLM API** | Google Gemini API | `gemini-2.5-flash` model via Java HTTP Client |
| **Performance Testing** | k6, Apache JMeter, Postman | Load, stress, spike, soak scripts & collections in `/tests` |
| **Deployment & Containers** | Docker & Docker Compose | Eclipse Temurin 17 JRE Alpine images, local JAR packaging |

---

## 3. Repository Topography & Structure

```
Event-Tracker/
├── .github/
│   └── workflows/
│       └── build.yml               # GitHub Actions CI for SonarQube & Maven verify
├── apps/
│   ├── api-gateway/                # Spring Cloud Gateway (Port 8080)
│   │   ├── src/main/java/com/careeros/gateway/
│   │   │   └── ApiGatewayApplication.java
│   │   ├── src/main/resources/
│   │   │   └── application.yml     # Dynamic Eureka routing & global CORS filters
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   ├── auth-service/               # Authentication & User Profile Service (Port 8081)
│   │   ├── src/main/java/com/careeros/auth/
│   │   │   ├── controller/         # AuthController.java, ProfileController.java
│   │   │   ├── entity/             # User.java, UserProfile.java
│   │   │   ├── repository/         # UserRepository.java, UserProfileRepository.java
│   │   │   ├── security/           # JwtTokenProvider, SecurityConfig, OAuth2LoginSuccessHandler
│   │   │   └── service/            # UserService.java, ProfileService.java
│   │   ├── src/main/resources/
│   │   │   └── application.yml
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   ├── ai-extraction-service/      # LLM Unstructured Text Extraction (Port 8082)
│   │   ├── src/main/java/com/careeros/ai/
│   │   │   ├── controller/         # ExtractionController.java
│   │   │   ├── dto/                # ExtractionRequest, PlacementDTO, ApplicationDTO
│   │   │   └── service/            # GeminiExtractionService.java
│   │   ├── src/main/resources/
│   │   │   └── application.yml
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   ├── backend/                    # Core Career OS Domain Service (Port 8085)
│   │   ├── src/main/java/com/eventtracker/
│   │   │   ├── client/             # AiExtractionClient.java (OpenFeign to :8082)
│   │   │   ├── controller/         # ApplicationController, PlacementController, RoutineController, SkillController, AnalyticsController
│   │   │   ├── entity/             # Application, Placement, Skill, RoutineTask, RoutineCompletion
│   │   │   ├── repository/         # ApplicationRepository, PlacementRepository, SkillRepository, RoutineTaskRepository, RoutineCompletionRepository
│   │   │   ├── security/           # JwtAuthenticationFilter, JwtTokenProvider, SecurityConfig, UserPrincipal
│   │   │   └── service/            # ApplicationService, PlacementService, RoutineService, SkillService, AnalyticsService, AiExtractionService
│   │   ├── src/main/resources/
│   │   │   ├── application.yml     # Database connection, Feign config, Eureka client
│   │   │   ├── application-prod.yml
│   │   │   └── schema.sql          # Full PostgreSQL DDL script with composite indices
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   ├── service-discovery/          # Netflix Eureka Registry (Port 8761)
│   │   ├── src/main/java/com/careeros/discovery/
│   │   │   └── ServiceDiscoveryApplication.java
│   │   ├── src/main/resources/
│   │   │   └── application.yml
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   └── web/                        # React 19 Frontend SPA (Port 5173)
│       ├── public/                 # Static assets, icons, manifest.webmanifest
│       ├── src/
│       │   ├── components/         # Modals, Cards, Tables, Layouts, ViewSkeletons
│       │   │   ├── ui/             # Radix-based UI building blocks
│       │   │   └── views/          # DashboardView, KanbanView, CalendarView, RoutineView
│       │   ├── contexts/           # ThemeContext.tsx
│       │   ├── hooks/              # useAuth.tsx, usePWAInstall.ts
│       │   ├── lib/                # restClient.ts, api/ (domain modules), utils.ts
│       │   ├── pages/              # Home, LandingPage, LoginPage, PlacementsPage, AddEventPage, OAuthSuccessPage, PrivacyPage, NotFound
│       │   ├── theme/              # Presets: Glass, Brutalist, Cyberpunk, Claymorphism, Terminal
│       │   ├── types/              # db-types.ts, types.ts
│       │   ├── App.tsx             # Root router, auth guards, cold-start warmup
│       │   ├── index.css           # Global Tailwind CSS tokens & theme variables
│       │   ├── main.tsx            # React DOM root mounting
│       │   └── sw.ts               # Workbox service worker
│       ├── Dockerfile
│       ├── package.json
│       ├── vercel.json             # SPA routing rewrite rule
│       └── vite.config.ts          # Vite configuration with PWA & Tailwind v4
│
├── docs/                           # Architecture specs, diagrams, migration guides
├── tests/                          # k6 load/soak/spike/stress tests, JMeter & Postman
├── docker-compose.yml              # Complete 7-service orchestration configuration
├── LATENCY_BENCHMARKS.md           # Empirical API latency measurements
├── README.md                       # Project landing overview
└── package.json                    # Monorepo root scripts & dev dependencies
```

---

## 4. System Architecture & Topology

### 4.1 Topology Diagram

```
                              +----------------------------+
                              |    Client Browser / PWA    |
                              |   (React 19 on Port 5173)  |
                              +--------------+-------------+
                                             |
                                             | HTTP / REST (VITE_API_URL: 8080)
                                             v
                     +----------------------------------------------+
                     |         Spring Cloud Gateway (:8080)         |
                     |  - Global CORS & Header Deduplication        |
                     |  - Dynamic Route Dispatch via Eureka ID      |
                     +-----------------------+----------------------+
                                             |
                      +----------------------+----------------------+
                      | Lookup service registry                      |
                      v                                             |
       +-------------------------------+                            |
       |  Netflix Eureka Registry      |                            |
       |  (service-discovery :8761)    |                            |
       +---------------+---------------+                            |
                       |                                            |
         +-------------+----------------------+                     |
         |                                    |                     |
         v (lb://career-os-auth-service)      v (lb://career-os)    v (lb://ai-extraction-service)
+-----------------------+           +-----------------------+    +--------------------------+
|  Auth Service (:8081) |           |  Core Backend (:8085) |    | AI Extraction (:8082)    |
|  - User registration  |           |  - Applications CRUD  |    | - Gemini 2.5 Flash       |
|  - Login & BCrypt     |           |  - Placements CRUD    |    | - Unstructured text      |
|  - OAuth2 Providers   |           |  - Routines & Habits  |    |   parsing & JSON schema  |
|  - JWT HS512 Signing  |           |  - Skills Portfolio   |    +-------------+------------+
|  - Profile Management |           |  - Analytics Engine   |                  |
+-----------+-----------+           |  - Local JWT Verify   |                  | OpenFeign
            |                       +-----------+-----------+                  | internal call
            |                                   |                              |
            |                                   +<-----------------------------+
            |                                   |
            v                                   v
+-----------------------+           +-----------------------+
|  career_os_auth_db    |           |    event_tracker_db   |
|  (PostgreSQL :5432)   |           |  (PostgreSQL :5432)   |
|  - users              |           |  - applications       |
|  - user_profiles      |           |  - placements         |
|                       |           |  - skills             |
|                       |           |  - routine_tasks      |
|                       |           |  - routine_completion |
+-----------------------+           +-----------------------+
```

### 4.2 Key Architectural Principles
1. **Single Entry Point Ingress:** The client application talks **strictly to port 8080** (API Gateway). The frontend has zero knowledge of internal microservice ports (`8081`, `8082`, `8085`).
2. **Decoupled Database Per Domain:**
   - Identity and credentials reside in `career_os_auth_db` owned exclusively by the Auth Service.
   - Domain records (`applications`, `placements`, `skills`, `routines`) reside in `event_tracker_db`.
3. **Decoupled Relational Entities:** Core entities store `userId` as a primitive `Long` scalar. There are **no JPA cross-service entity joins** (`@ManyToOne private User user`), preventing distributed transaction locks.
4. **Stateless Local JWT Verification:**
   - The Auth Service signs JWTs using a shared secret (`APP_JWT_SECRET` / `JWT_SECRET`) with HMAC-SHA512.
   - Core Backend (`:8085`) verifies the cryptographic signature locally on every request without making remote network calls to Auth Service, keeping steady-state read latencies under 50ms.
5. **Decoupled AI Processing:** Gemini SDK and prompt engineering run in `ai-extraction-service` (:8082). Latencies or rate limits from Google APIs never block thread pools or database connections in the core backend.

---

## 5. Authentication & Security Architecture

### 5.1 Authentication Flow

```
1. EMAIL/PASSWORD LOGIN:
User -> Client -> POST /api/auth/login -> Gateway (:8080) -> Auth Service (:8081)
Auth Service: Verify email -> BCrypt.check(password, hash) -> Issue HS512 JWT (15 days)
Client: Stores JWT in localStorage('token') -> Dispatches to /dashboard

2. SOCIAL OAUTH2 LOGIN (Google/GitHub Popup Architecture):
Client: window.open('/oauth2/authorization/{provider}', 'OAuthLogin', 'width=500,height=650')
Browser Popup -> Gateway (:8080) -> Auth Service (:8081) -> Redirects to Google/GitHub
User approves -> Callback to Auth Service (:8081/login/oauth2/code/*)
OAuth2LoginSuccessHandler: Extract email/name -> Upsert User -> Generate JWT
Redirects popup to: https://frontend/oauth-success?token={JWT}
OAuthSuccessPage (in popup): window.opener.postMessage({ type: 'OAUTH_SUCCESS', token }) -> window.close()
Client Parent Window: Catches message -> localStorage.setItem('token', token) -> Redirects to /dashboard

3. AUTHENTICATED RESOURCE REQUEST:
Client -> Axios request with Header: 'Authorization: Bearer <token>' -> Gateway (:8080) -> Backend (:8085)
JwtAuthenticationFilter: Parses Bearer token -> Verifies HS512 signature using JWT_SECRET
Extracts: userId and email -> Injects UserPrincipal into SecurityContextHolder
Controller/Service: Invokes getCurrentUserId() -> Queries PostgreSQL filtered by user_id
```

### 5.2 Token Specifications
- **Algorithm:** HMAC-SHA512 (`SignatureAlgorithm.HS512`)
- **Expiration:** 1,296,000,000 milliseconds (15 days)
- **Claims:** Subject (`userId`), custom claim `email`, issuedAt, expiration.

---

## 6. Frontend Architecture & State Management

### 6.1 Architecture Overview
The frontend is a React 19 Single Page Application built on Vite:
- **Router:** Wouter (`wouter`) chosen for minimal footprint (<2KB). Custom event dispatching patches `pushState` and `replaceState` to trigger `locationchange` listeners for reactive tab synchronizations.
- **Server State:** TanStack Query (React Query v5) handles all asynchronous caching, stale-time invalidation, and optimistic updates.
- **Client State / Contexts:**
  - `AuthContext`: Tracks JWT token, user object (`/api/auth/me`), backend readiness flags, cold-start polling loops, and authentication transient error retry handlers.
  - `ThemeContext`: Controls active design system tokens and light/dark modes.
- **Dynamic View Engine:** The `/dashboard` route dynamically renders sub-views based on URL query parameters (`?view=dashboard`, `?view=kanban`, `?view=calendar`, `?view=analytics`, `?view=skills`, `?view=routine`, `?view=profile`).

### 6.2 Multi-Theme Engine
The UI features five distinct design systems configured via CSS custom properties:
1. **Glassmorphic (`glass` - Default):** Translucent backgrounds, `backdrop-blur-md`, subtle border highlights.
2. **Neo-Brutalist (`brutalist`):** High contrast, solid 2px-3px borders, hard drop shadows (`shadow-[4px_4px_0px_#000]`), sharp edges.
3. **Cyberpunk (`cyberpunk`):** Neon green and yellow accents, dark terminal backgrounds, monospace styling.
4. **Claymorphic (`claymorphism`):** Soft inner shadows, floating 3D bubble effects, rounded radii.
5. **Terminal / Monospace (`terminal`):** Retro hacker aesthetics, green-on-black phosphor palettes.

### 6.3 Resilience & Cold-Start Recovery
Because the application is architected to deploy on serverless/free-tier hosting (e.g., Render, Railway) where instances spin down on idle:
- **Warm-Up Ping:** `App.tsx` fires a non-blocking `GET /actuator/health` upon initial mount.
- **Readiness Polling Loop:** In `useAuth.tsx`, if a token exists but the backend is dormant, a polling cycle pings `/actuator/health` every 3 seconds with an `AbortController` and a 100-second timeout window.
- **Smart UI Feedback:** Instead of crashing or showing a blank page, the UI renders a dedicated waking screen with animated pulses and a manual "Retry Connection" fallback.

---

## 7. Backend & Microservices Architecture

### 7.1 API Gateway (`apps/api-gateway`)
- **Framework:** Spring Cloud Gateway (Reactive, Project Reactor / Netty).
- **Service ID:** `api-gateway` on port `8080`.
- **Dynamic Route Predicates:**
  - `/api/auth/**`, `/api/profile/**`, `/oauth2/**`, `/login/oauth2/**` -> `lb://career-os-auth-service`
  - `/api/extraction/**` -> `lb://ai-extraction-service`
  - `/api/**` -> `lb://career-os`
- **Global Filters:** Deduplicates `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials` headers to avoid duplicate header rejection in browsers.

### 7.2 Auth Service (`apps/auth-service`)
- **Port:** `8081` | **Eureka ID:** `career-os-auth-service`
- **Responsibilities:** User entity lifecycle, password encryption (BCrypt), JWT token signing, OAuth2 authorization handling, and user profile preferences.
- **Database:** `career_os_auth_db` (`users`, `user_profiles`).

### 7.3 Core Backend Service (`apps/backend`)
- **Port:** `8085` | **Eureka ID:** `career-os`
- **Responsibilities:** Business logic for applications, placement pipelines, daily habits, skills portfolio, and analytics calculations.
- **Inter-Service Communication:** Uses Spring Cloud OpenFeign (`AiExtractionClient.java`) to make synchronous internal calls to `ai-extraction-service` for AI parsing.
- **Database:** `event_tracker_db` (`applications`, `placements`, `skills`, `routine_tasks`, `routine_completion`).

### 7.4 AI Extraction Service (`apps/ai-extraction-service`)
- **Port:** `8082` | **Eureka ID:** `ai-extraction-service`
- **Responsibilities:** Ingests raw recruitment emails and prompts Google's `gemini-2.5-flash` model.
- **Prompt Engineering:** Enforces strict JSON formatting, ISO-8601 timestamps, verbatim preserving of URLs and identifiers, and automatic retry execution (up to 3 attempts).

### 7.5 Service Discovery Server (`apps/service-discovery`)
- **Port:** `8761`
- **Technology:** Netflix Eureka Server.
- **Configuration:** Standalone registry (`register-with-eureka: false`, `fetch-registry: false`). Fast lease eviction timer (`5000ms`) and 5-second renewal intervals for rapid local development heartbeats.

---

## 8. Database Architecture & Schema Integrity

### 8.1 Schema Overview (`event_tracker_db` & `career_os_auth_db`)

| Table Name | Database | Primary Key | Description |
| :--- | :--- | :--- | :--- |
| `users` | `career_os_auth_db` | `id` (BIGSERIAL) | Core user authentication records (email, hashed password, role, display name). |
| `user_profiles` | `career_os_auth_db` | `id` (BIGSERIAL) | Personal user profiles (college, skills, GitHub, LinkedIn, portfolio, email notification flags). |
| `applications` | `event_tracker_db` | `id` (BIGSERIAL) | Hackathons, coding contests, and events tracked by users. |
| `placements` | `event_tracker_db` | `id` (BIGSERIAL) | Placement and job application pipelines with compensation and dates. |
| `skills` | `event_tracker_db` | `id` (BIGSERIAL) | Technical skills categorized by domain and competency level. |
| `routine_tasks` | `event_tracker_db` | `id` (BIGSERIAL) | Habit tasks tracked on a recurring daily basis. |
| `routine_completion`| `event_tracker_db` | `id` (BIGSERIAL) | Daily completion records for each routine task. |

### 8.2 Composite Constraints & Idempotency Rules
1. **Application Deduplication:** `CREATE UNIQUE INDEX unique_user_event_url ON applications (user_id, event_url);` — Guarantees a candidate cannot accidentally create duplicate records for the same event URL.
2. **Placement Deduplication:** `CREATE UNIQUE INDEX unique_user_company_role_link ON placements (user_id, company_name, role, application_link);` — Prevents multiple duplicate submissions for the same role and link.
3. **Skill Deduplication:** `CREATE UNIQUE INDEX unique_user_skill ON skills (user_id, name);` — Prevents duplicate skill entries for a given user.
4. **Routine Daily Completion:** `CONSTRAINT uq_routine_completion UNIQUE (routine_task_id, completion_date);` — Guarantees idempotent toggle behavior per calendar date.

---

## 9. Environment Variables & Configuration Matrix

| Variable Name | Required By | Purpose / Usage |
| :--- | :--- | :--- |
| `VITE_API_URL` | Frontend (`apps/web`) | Base URL for API Gateway (`http://localhost:8080` in dev). |
| `AUTH_DB_URL` / `DB_URL` | Auth Service / Backend | JDBC connection string to PostgreSQL database. |
| `DB_USERNAME` | Auth Service / Backend | Database user (`postgres`). |
| `DB_PASSWORD` | Auth Service / Backend | Database password. |
| `JWT_SECRET` / `APP_JWT_SECRET`| Auth Service & Backend | Shared cryptographic secret key for signing & verifying HS512 JWTs. |
| `EUREKA_SERVER_URL` | All Microservices | Registry URL (`http://localhost:8761/eureka/` or `http://service-discovery:8761/eureka/`). |
| `GOOGLE_CLIENT_ID` | Auth Service | OAuth2 Client ID for Google Social Login. |
| `GOOGLE_CLIENT_SECRET` | Auth Service | OAuth2 Client Secret for Google Social Login. |
| `GITHUB_CLIENT_ID` | Auth Service | OAuth2 Client ID for GitHub Social Login. |
| `GITHUB_CLIENT_SECRET` | Auth Service | OAuth2 Client Secret for GitHub Social Login. |
| `GEMINI_API_KEY` | AI Extraction Service | API Key for Google Generative AI (Gemini). |
| `GEMINI_API_MODEL` | AI Extraction Service | Target Gemini model (`gemini-2.5-flash`). |
| `AI_EXTRACTION_SERVICE_URL` | Core Backend | URL for OpenFeign to reach AI extraction service (`http://localhost:8082`). |
| `PORT` / `AUTH_PORT` / `AI_PORT` | Individual Services | Port overrides for microservices. |

---

## 10. Performance, Diagnostics & Known Technical Debt

### 10.1 Latency Characteristics (Empirical Benchmarks)
- **Steady-State Reads:** Sub-100ms across all core endpoints (`GET /api/placements`: 38ms-62ms; `GET /api/applications`: 40ms-77ms; `GET /api/routines`: 45ms-94ms).
- **Mutations (POST / PUT):** Fast writes (70ms-250ms), with `/api/auth/login` intentionally taking ~400ms due to security-hardened BCrypt hashing iterations.
- **Cold Starts:** Free-tier spinups introduce a 15-45s wake-up delay; handled on the client side via the centralized `useAuth` polling loop.

### 10.2 Technical Debt & Architectural Risks
1. **Shared PostgreSQL Instance:** While databases are partitioned (`career_os_auth_db` and `event_tracker_db`), in development and docker-compose they reside on the same PostgreSQL host. In enterprise production, they should run on independent managed database clusters.
2. **Shared JWT Secret (Symmetric HS512):** Auth Service and Backend currently share a symmetric key. A future improvement would be switching to asymmetric RS256 (Private Key in Auth Service for signing, Public JWKS endpoint consumed by Backend and Gateway).
3. **Gateway Ingress Authentication:** Currently, the API Gateway acts as a pure routing proxy without verifying JWT tokens; token verification occurs at the downstream microservices. Centralizing token validation or rate-limiting at the Gateway using a GatewayFilter would prevent unauthorized traffic from reaching inner services.
4. **OpenFeign Direct URL Fallback:** `AiExtractionClient.java` supports dynamic lookup via Eureka, but also relies on an optional hardcoded `AI_EXTRACTION_SERVICE_URL`. Ensuring Eureka-only service discovery resolution in all profiles is recommended.

---

## 11. Development & Operations Guide

### 11.1 Local Development Startup Order
To run the full distributed system locally:
```bash
# 1. Start Service Discovery (Port 8761)
cd apps/service-discovery && mvn spring-boot:run

# 2. Start Auth Service (Port 8081)
cd apps/auth-service && mvn spring-boot:run

# 3. Start AI Extraction Service (Port 8082)
cd apps/ai-extraction-service && mvn spring-boot:run

# 4. Start Core Backend Service (Port 8085)
cd apps/backend && mvn spring-boot:run

# 5. Start API Gateway (Port 8080)
cd apps/api-gateway && mvn spring-boot:run

# 6. Start Web Frontend (Port 5173)
cd apps/web && npm install && npm run dev
```

### 11.2 Docker Compose Orchestration
The monorepo includes a complete multi-container setup in `docker-compose.yml`:
```bash
docker-compose up --build
```
This boots all 6 services along with PostgreSQL 15 on port 5432 with persistent volume mounting.
