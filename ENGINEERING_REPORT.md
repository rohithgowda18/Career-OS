# ENGINEERING REPORT
### Career OS — Event & Placement Tracker
**Audit Date:** 2026-07-02 | **Auditor:** Staff Engineer (Google L6/L7) + Senior Technical Recruiter

---

## 1. EXECUTIVE SUMMARY

This report is based on a complete line-by-line audit of every source file. Every statement is backed by actual code. No features are assumed or hallucinated.

**Project:** Career OS — A full-stack monorepo for tracking event applications (hackathons, workshops, conferences, internships) and career placements. It integrates JWT + OAuth2 auth, AI-powered email extraction via Gemini, multi-view dashboards (list, kanban, calendar, analytics), and a PWA shell.

**Overall Engineering Verdict:** Well-above-average student/portfolio project with genuine production-grade patterns. The backend demonstrates real N-tier discipline. The frontend is feature-rich and visually polished. Security is partially correct with critical gaps. Testing is critically thin. Deployment is properly containerized and multi-platform.

---

## 2. ARCHITECTURE REVIEW

### 2.1 Overall Architecture

```
Browser (SPA - Vercel)
    |
    React 19 + TypeScript (Vite)
       - Wouter (client routing)
       - TanStack Query (server state)
       - Axios (HTTP client w/ interceptors)
       - Radix UI + Tailwind CSS 4
    |
    REST API (JSON, JWT Bearer)
    |
Spring Boot 3.2 (Render, Docker)
    - Spring Security (JWT filter chain)
    - OAuth2 Login (Google + GitHub)
    - Spring Data JPA (Hibernate)
    - Gemini 2.5 Flash (via Java HttpClient)
    - Spring Mail (Gmail SMTP)
    - SpringDoc OpenAPI (Swagger UI)
    |
PostgreSQL (Neon serverless)
    - users
    - user_profiles
    - applications
    - placements
```

### 2.2 Backend Architecture

- **Pattern:** N-Tier (Controller -> Service -> Repository -> Entity)
- **Framework:** Spring Boot 3.2.3 on Java 17
- **Security:** Stateless JWT (HS512, JJWT 0.12.3) + OAuth2 login
- **ORM:** Spring Data JPA with Hibernate, DDL auto=none, schema.sql init
- **AI:** Raw Java 11 HttpClient calling Google Generative Language REST API (no SDK)
- **Email:** Spring Mail (JavaMailSender) via Gmail SMTP — service exists but is never called from any controller. Dead code in production.
- **Validation:** Bean Validation (jakarta.validation) on DTOs

### 2.3 Frontend Architecture

- **Framework:** React 19, TypeScript, Vite 7
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query v5 (server state), React useState (local state)
- **Styling:** Tailwind CSS 4 (via @tailwindcss/vite plugin)
- **UI Primitives:** Radix UI (full suite), Shadcn-style components in src/components/ui/
- **Charts:** Recharts (SVG-based)
- **Animations:** Framer Motion
- **PWA:** vite-plugin-pwa (service worker auto-update, installable)
- **API Layer:** Axios with request/response interceptors (JWT injection, 401 handling)
- **Code-splitting:** All pages are React.lazy() loaded

### 2.4 Authentication Flow

1. **Email/Password:** POST /api/auth/register or /login -> password BCrypt-hashed -> JWT (HS512, 30-min expiry) returned
2. **OAuth2 (Google/GitHub):** Browser redirects to /oauth2/authorization/{provider} -> Spring OAuth2 client handles callback -> OAuth2LoginSuccessHandler creates/finds User -> generates JWT -> redirects to /oauth-success?token=<jwt>
3. **Protected Requests:** JwtAuthenticationFilter (OncePerRequestFilter) extracts Bearer token -> validates HS512 signature -> loads User by ID -> sets SecurityContextHolder
4. **Frontend:** Token stored in localStorage -> Axios interceptor attaches Authorization header -> 401 interceptor clears token

### 2.5 Patterns Used

- N-Tier Architecture: Strict Controller -> Service -> Repository separation [YES]
- Repository Pattern: Spring Data JPA repositories [YES]
- DTO Pattern: Input/output DTOs separating entities from API [YES]
- Filter Chain Pattern: OncePerRequestFilter for JWT [YES]
- Strategy Pattern: OAuth2 success handler [YES]
- Observer Pattern: TanStack Query cache invalidation [YES]
- Lazy Loading: React.lazy() for all page components [YES]
- Factory Method: parseStatus/parseEventType in service layer [YES]

---

## 3. CODE QUALITY REVIEW

### 3.1 Strengths

- Proper N-Tier separation — no business logic in controllers
- DTO isolation — entities not leaked to API layer (with one exception: getDashboardData() returns raw Application objects)
- Enum-safe parsing — parseStatus/parseEventType methods handle invalid input gracefully
- Lombok usage reduces boilerplate
- @Transactional on service classes
- FetchType.LAZY on all ManyToOne relationships

### 3.2 Code Smells / Issues Found

| Issue | Location | Severity |
|---|---|---|
| normalizeUrl() duplicated in ApplicationService AND PlacementService | Both service files | Medium |
| getDashboardData() returns raw Application entities (not DTOs) | AnalyticsService.java:119 | Medium |
| EmailService defined but never called from any controller or scheduler | EmailService.java | Low |
| getPlacementAnalytics() defined in AnalyticsService but no controller endpoint | AnalyticsService.java:124 | Low |
| console.log statements left in usePWAInstall.ts | usePWAInstall.ts:20-42 | Low |
| window.location.href = '/login' hard navigation breaks SPA | Home.tsx:61 | Medium |
| 401 interceptor redirect is commented out | restClient.ts:63 | Low |
| EmailServiceTests is @Disabled with hard-coded personal email | EmailServiceTests.java:19 | Low |
| application-prod.yml uses ddl-auto: update — dangerous in production | application-prod.yml:13 | HIGH |
| actuator/** is fully public in SecurityConfig | SecurityConfig.java:77 | CRITICAL |
| Management endpoints expose include: "*" including heapdump, env | application.yml:89 | CRITICAL |

### 3.3 SOLID Assessment

- S (Single Responsibility): Each class has one clear role [PASS]
- O (Open/Closed): Enums require code change to add new types [PARTIAL]
- L (Liskov Substitution): Not applicable [N/A]
- I (Interface Segregation): No interfaces for services [FAIL]
- D (Dependency Inversion): Controllers depend on concrete classes [PARTIAL]

---

## 4. SECURITY REVIEW

### 4.1 Implemented Correctly

- BCrypt password hashing via PasswordEncoderConfig [YES]
- JWT HS512 signing with key length validation (@PostConstruct enforces 64+ bytes) [YES]
- CORS configured with explicit allowed origins (not wildcard) [YES]
- CSRF disabled — appropriate for stateless JWT API [YES]
- OAuth2 redirect URL CRLF injection prevention [YES]
- Input validation via Bean Validation on DTOs [YES]

### 4.2 Security Vulnerabilities Found

| Vulnerability | Location | Severity |
|---|---|---|
| Actuator fully public | SecurityConfig.java:77 + application.yml:89 | CRITICAL |
| JWT in localStorage (XSS vulnerable) | authApi.ts:17, restClient.ts:35 | HIGH |
| No rate limiting on login/register | All public endpoints | HIGH |
| No refresh token mechanism | Entire auth system | MEDIUM |
| ddl-auto: update in production | application-prod.yml:13 | MEDIUM |
| No length limit on Gemini extraction input | PlacementController.java:35 | MEDIUM |
| Hard-coded DB password default | application.yml:11 | MEDIUM |
| No server-side token invalidation on logout | Entire auth flow | MEDIUM |

---

## 5. PERFORMANCE REVIEW

### 5.1 Backend

- DB hit per request: Every authenticated request calls userService.findById() in the JWT filter — no caching. High traffic bottleneck.
- Analytics computations: AnalyticsService fetches ALL user records and computes in Java streams — SQL GROUP BY would be far more efficient.
- Gemini service: Uses blocking Java HttpClient. Should use CompletableFuture.
- Pagination: Applications and Placements list endpoints use Spring Pageable correctly [YES]
- JPA fetch type: All relationships use FetchType.LAZY [YES]

### 5.2 Frontend

- Code splitting: All pages use React.lazy() [YES]
- TanStack Query: Server state caching and background refetching [YES]
- PWA caching: Workbox configured for static assets [YES]

### 5.3 Database

- Indexes on email, user_id (applications/placements), status [YES]
- Unique indexes prevent duplicate data [YES]
- Missing composite index on (user_id, status) for filtered queries

---

## 6. COMPLETE API ENDPOINT INVENTORY

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | Public | Create user, returns JWT |
| POST | /api/auth/login | Public | Authenticate, returns JWT |
| GET | /api/auth/me | JWT | Current user info |
| POST | /api/auth/logout | JWT | Clear session (client-side only) |
| GET | /api/applications | JWT | List (pageable, status+search filter) |
| GET | /api/applications/{id} | JWT | Single application |
| POST | /api/applications | JWT | Create |
| PUT | /api/applications/{id} | JWT | Update |
| DELETE | /api/applications/{id} | JWT | Delete |
| GET | /api/placements | JWT | List (pageable, status+search filter) |
| GET | /api/placements/{id} | JWT | Single placement |
| POST | /api/placements | JWT | Create |
| PUT | /api/placements/{id} | JWT | Update |
| DELETE | /api/placements/{id} | JWT | Delete |
| POST | /api/placements/extract | JWT | AI-extract from email text |
| GET | /api/analytics/applications/summary | JWT | Summary metrics |
| GET | /api/analytics/applications/status-distribution | JWT | Status distribution |
| GET | /api/analytics/applications/conversion-rates | JWT | Acceptance rates |
| GET | /api/analytics/placements/summary | JWT | Placement summary |
| GET | /api/analytics/placements/status-distribution | JWT | Placement status dist |
| GET | /api/analytics/placements/conversion-rates | JWT | Funnel conversion rates |
| GET | /api/analytics/placements/trends | JWT | Monthly trends |
| GET | /api/analytics/dashboard | JWT | Dashboard aggregate |
| GET | /api/profile | JWT | Get user profile |
| PUT | /api/profile | JWT | Update user profile |
| GET | /actuator/** | PUBLIC WARN | Spring Actuator (health, env, heap) |

---

## 7. TESTING REVIEW

| Test File | Type | Tests | Status |
|---|---|---|---|
| EventAppTrackerApplicationTests.java | Integration (SpringBootTest) | 2 | contextLoads + findFilteredQueries |
| EmailServiceTests.java | Integration | 1 | @Disabled — never runs |
| tests/ (root) | — | 0 | Empty directory |
| Frontend (vitest) | Unit | 0 | vitest.config.ts exists but no test files |

**Effective coverage: <5%**

---

## 8. DEPLOYMENT REVIEW

### Backend (Docker -> Render)
- Multi-stage Dockerfile (Maven build -> Alpine JRE) [YES]
- Non-root user (spring:spring) in container [YES]
- JVM tuning: SerialGC, Xmx220m for free-tier [YES]
- Health check via wget to /actuator/health [YES]
- ddl-auto: update in production is risky [RISK]
- No docker-compose.yml for local stack [MISSING]

### Frontend (Vercel)
- vercel.json rewrites all routes to index.html [YES]
- .env.production sets VITE_API_URL [YES]
- PWA configured [YES]

### CI/CD (GitHub Actions)
- Single workflow: SonarQube static analysis on master/test pushes
- Builds with -DskipTests (no tests run in CI)
- No Docker build/push pipeline
- No frontend CI pipeline
- No CD automation — manual deploys on Render/Vercel

---

## 9. TECHNICAL DEBT BACKLOG

| Debt Item | Priority | Effort |
|---|---|---|
| Secure Actuator endpoints | CRITICAL | Low |
| Remove ddl-auto: update from prod | CRITICAL | Low |
| Remove hard-coded DB password default | HIGH | Low |
| Add rate limiting on auth endpoints | HIGH | Low |
| Write unit and integration test suite | HIGH | High |
| Extract normalizeUrl() to shared utility | MEDIUM | Low |
| Replace schema.sql with Flyway/Liquibase | HIGH | Medium |
| Move JWT to HttpOnly cookies | HIGH | Medium |
| Cache user lookup in JwtFilter | MEDIUM | Low |
| Replace stream aggregation with SQL GROUP BY | MEDIUM | Medium |
| Wire EmailService to @Scheduled jobs | MEDIUM | Medium |
| Add service interfaces for DI inversion | LOW | Medium |

---

## 10. RECRUITER REVIEW

### Would this pass resume screening?
**YES** — for any company up to mid-tier. For Google/Amazon L5+, it needs better testing and security hygiene.

### Strengths for Resume
1. Full-stack monorepo with clear separation of concerns
2. Real AI integration (Gemini, not just OpenAI wrapper)
3. Dual authentication (JWT + OAuth2 — Google AND GitHub)
4. Production deployed (Vercel + Render + Neon)
5. PWA (installable mobile app)
6. Analytics dashboard with charts
7. Docker containerization with JVM optimization
8. SonarQube CI integration
9. 25+ API endpoints documented

### Weaknesses for Senior Roles
1. Testing coverage is ~5% — a red flag for senior hiring
2. Critical security gaps (exposed Actuator, no rate limiting)
3. No Flyway/Liquibase
4. No service interfaces
5. Analytics performance will degrade with scale

---

## 11. FINAL SCORING

| Category | Score /10 | Notes |
|---|---|---|
| Backend Quality | 7.5 | N-tier, JWT, OAuth2, AI — solid; missing interfaces, rate limiting |
| Frontend Quality | 8.0 | React 19, TanStack Query, PWA, 5 views, clean code |
| Database | 6.5 | Good schema, indexes — missing migration tool, no enum constraints |
| Security | 4.5 | Good JWT — critical actuator exposure, localStorage JWT |
| Architecture | 7.5 | Clean N-tier, monorepo, but no cache, no CD |
| Performance | 6.0 | Paginated API, lazy load, stream analytics is inefficient |
| Testing | 1.5 | 2 smoke tests, 0 unit tests — nearly absent |
| Deployment | 6.5 | Docker, Vercel, Render — no CD pipeline |
| Documentation | 7.0 | Good README, 6 doc files — some outdated API routes |
| AI Integration | 7.5 | Real Gemini integration with retry and schema reflection |
| Code Quality | 7.0 | Clean, DRY violations, no interfaces |
| Innovation | 7.0 | PWA + AI + full analytics is impressive for a student project |
| Resume Value | 8.0 | Stands out clearly among college projects |
| **Overall** | **6.8** | Strong portfolio project; production-ready with fixes |
