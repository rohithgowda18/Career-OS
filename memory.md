# MEMORY.MD — CAREER OS (EVENT APP TRACKER) INTELLIGENCE & BRAIN DOCUMENT

> **System Blueprint & Codebase Operational Memory**  
> *Generated on July 29, 2026*

---

## 1. PROJECT OVERVIEW

**Career OS** (also referred to as `event-app-tracker`) is a full-stack, enterprise-grade job application, campus placement, skill tracking, daily routine management, and AI-powered opportunity extraction platform. 

The application is structured as a monorepo featuring:
- **Frontend App (`apps/web`)**: React 19 + TypeScript + Vite single-page web application featuring dynamic dark/glassmorphic themes, responsive dashboards, Kanban boards, interactive calendars, daily habit track routines, skill matrices, and PWA capabilities.
- **Backend App (`apps/backend`)**: Java 17 + Spring Boot 3.2.3 REST API backend backed by PostgreSQL, Spring Security JWT & OAuth2, Spring Data JPA, Jakarta Bean Validation, Spring Mail, and Google Gemini AI API integrations.
- **Testing & Infrastructure**: Postman API suites, JMeter stress tests, k6 load/spike/soak scripts, Docker containerization, and Render/Vercel deployment targets.

---

## 2. BUSINESS PURPOSE & USER WORKFLOWS

### Business Problem Solved
Early-career software engineers, students, and job seekers face fragmented tracking mechanisms across job portals (LinkedIn, Unstop, Indeed, glassdoor), placement drives, daily skill building, and interview schedules. Applications are frequently lost or missed due to deadline clutter and poor task management.

### Target Users
- Students and recent graduates tracking university placement drives.
- Software developers applying across multiple external job portals.
- Job seekers wanting AI-powered smart parsing of event job links directly into structured application trackers.

### Core Features & Value Propositions
1. **Application Tracking**: Track status lifecycle (`SAVED`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`), set deadline reminders, store notes, and maintain event links.
2. **Placement Tracking**: Campus placement drive lifecycle with stipend, CTC, online assessment (OA) dates, and interview schedules.
3. **AI Web Scraping / Extraction (`GeminiExtractionService`)**: Automatically scrape job application web pages via standard HTTP + Cheerio fallback / Jsoup or Google Gemini AI parsing to extract company name, role, deadline, location, stipend/CTC, and event type.
4. **Skill Matrix**: Category-based skill tracking (e.g., Languages, Frameworks, Core CS, Tools) with proficiency levels (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`).
5. **Routine / Daily Habit Tracking**: Daily interactive checkboxes to check off core routine tasks (e.g. LeetCode practice, System Design, Resume building) with historical completion logging.
6. **Analytics & Insights**: Funnel metrics, application response rates, status breakdown graphs, and deadline alerts.

---

## 3. TECH STACK

| Tier | Technology | Purpose / Details |
| --- | --- | --- |
| **Frontend Core** | React 19, TypeScript 5.9 | Reactive component UI framework |
| **Build Tooling** | Vite 7, `@vitejs/plugin-react` | Ultra-fast HMR and bundle compilation |
| **Routing** | Wouter 3.3 | Lightweight client-side router |
| **State & Async Data** | `@tanstack/react-query` v5, React Context (`useAuth`, `ThemeContext`) | Async query caching, auth state, glass/dark theme |
| **Styling & UI** | Tailwind CSS v4, Radix UI primitives, Lucide Icons, Sonner (Toasts) | Responsive design system, accessible UI modals |
| **Data Viz & Motion** | Recharts, Framer Motion | Dynamic analytics charts and micro-animations |
| **Backend Core** | Java 17, Spring Boot 3.2.3 | RESTful web web service framework |
| **Security & Auth** | Spring Security 6, JJWT 0.12.3, Spring OAuth2 Client | JWT authentication & Google/GitHub OAuth2 SSO |
| **Database & ORM** | PostgreSQL 15, Spring Data JPA, Hibernate, schema.sql | Relational persistence, transactional data layer |
| **AI Integration** | Google Gemini API (`gemini-2.5-flash`) | NLP/AI job posting extraction |
| **Email Service** | Spring Starter Mail (SMTP) | Digest emails and alert notifications |
| **Testing** | Vitest, JUnit 5, H2 Database, k6, Apache JMeter | Unit, integration, performance & load testing |
| **Containerization** | Docker, Docker Compose | PostgreSQL + Spring Boot container orchestration |

---

## 4. REPOSITORY STRUCTURE

```
Event-Tracker/
├── .github/
│   └── workflows/
│       └── build.yml               # CI GitHub Actions workflow for backend & frontend
├── apps/
│   ├── backend/                    # Spring Boot 3 Java Application
│   │   ├── Dockerfile              # Multi-stage Docker build for backend
│   │   ├── pom.xml                 # Maven dependencies and plugins
│   │   └── src/
│   │       ├── main/
│   │       │   ├── java/com/eventtracker/
│   │       │   │   ├── EventAppTrackerApplication.java
│   │       │   │   ├── config/     # WebMvcCorsConfig, OpenAPI Swagger config
│   │       │   │   ├── controller/ # REST Endpoints (Auth, Application, Placement, Skill, Routine, Analytics, Profile, Import)
│   │       │   │   ├── dto/        # Request/Response payloads
│   │       │   │   ├── entity/     # JPA Entities (User, UserProfile, Application, Placement, Skill, RoutineTask, RoutineCompletion)
│   │       │   │   ├── exception/  # GlobalExceptionHandler & custom exceptions
│   │       │   │   ├── repository/ # Spring Data JPA Repositories
│   │       │   │   ├── security/   # SecurityConfig, JwtTokenProvider, JwtAuthenticationFilter, UserPrincipal, OAuth2LoginSuccessHandler
│   │       │   │   ├── service/    # Business logic & services
│   │       │   │   └── util/       # Utility classes
│   │       │   └── resources/
│   │       │       ├── application.yml
│   │       │       ├── application-prod.yml
│   │       │       └── schema.sql  # SQL schema definition & indices
│   │       └── test/               # JUnit 5 integration & controller tests
│   └── web/                        # React + Vite TypeScript Application
│       ├── index.html              # HTML entry point with font preloads
│       ├── package.json            # Frontend node packages & scripts
│       ├── tsconfig.json           # TypeScript configuration
│       ├── vite.config.ts          # Vite build & alias `@/` config
│       └── src/
│           ├── App.tsx             # Main Wouter router & global layout
│           ├── main.tsx            # React DOM root entry
│           ├── index.css           # Tailwind CSS directives & custom design system tokens
│           ├── components/         # Modals, cards, tables, layout, views (Dashboard, Calendar, Kanban, Routine)
│           ├── contexts/           # ThemeContext (Glass/Dark/Light)
│           ├── hooks/              # useAuth, usePWAInstall
│           ├── lib/                # API client functions, REST client instance, date utilities
│           ├── pages/              # LandingPage, LoginPage, Home, PlacementsPage, AddEventPage, SkillsPage, OAuthSuccessPage, PrivacyPage, NotFound
│           └── types/              # TypeScript type definitions
├── docs/                           # In-depth architectural & feature documentation
│   ├── BACKEND_OVERVIEW.md
│   ├── FRONTEND_OVERVIEW.md
│   ├── SECURITY_DATABASE.md
│   └── features.md
├── tests/                          # Performance & Load testing suites
│   ├── Career-OS.jmx               # JMeter load script
│   ├── Career-OS.postman_collection.json
│   ├── load-test.js / soak-test.js / spike-test.js / stress-test.js # k6 scripts
├── docker-compose.yml              # Local postgres & backend docker orchestration
├── package.json                    # Workspace root scripts
├── render.env                      # Production deployment environment variables template
└── vitest.config.ts                # Vitest workspace test config
```

---

## 5. SYSTEM ARCHITECTURE

### Text Architecture Diagram

```
[ Browser / Client Web Application ]
         │
         │ (HTTP REST API / JSON + Bearer Token)
         ▼
┌─────────────────────────────────────────────────────────┐
│ Spring Security Filter Chain                            │
│  ├─ CorsFilter                                          │
│  ├─ JwtAuthenticationFilter                             │
│  └─ OAuth2LoginAuthenticationFilter                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Spring Boot Controllers Layer                           │
│  ├─ AuthController         ├─ PlacementController       │
│  ├─ ApplicationController  ├─ SkillController           │
│  ├─ AnalyticsController    ├─ RoutineController         │
│  └─ ImportController       └─ ProfileController         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Service Layer (Business Logic)                          │
│  ├─ ApplicationService     ├─ GeminiExtractionService   │
│  ├─ PlacementService       ├─ AnalyticsService          │
│  ├─ RoutineService         └─ ImportService             │
└───────────┬─────────────────────────────────┬───────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│ Spring Data JPA       │         │ Google Gemini AI REST │
│ Repository Interfaces │         │ Service (External)    │
└───────────┬───────────┘         └───────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│ PostgreSQL Database (Containerized or Cloud Render DB)  │
│  (users, user_profiles, applications, placements,       │
│   skills, routine_tasks, routine_completion)            │
└─────────────────────────────────────────────────────────┘
```

---

## 6. ROUTING MAP

Client-side routing is handled by **Wouter** in `apps/web/src/App.tsx`.

| Path | Component / Page | Access Control | Description |
| --- | --- | --- | --- |
| `/` | `LandingPage` | Public (Redirects to `/dashboard` if authenticated) | Hero marketing landing page showcasing features |
| `/login` | `LoginPage` | Public (Redirects to `/dashboard` if authenticated) | User login and registration form + OAuth buttons |
| `/oauth-success` | `OAuthSuccessPage` | Public / Callback | Extracts JWT token from query parameters and stores in `localStorage` |
| `/dashboard` | `Home` (`DashboardLayout`) | **Protected** | Main workspace dashboard (Overview, Calendar, Kanban, Routine) |
| `/placements` | `PlacementsPage` (`DashboardLayout`) | **Protected** | Placement drive management and tracking |
| `/add` | `AddEventPage` (`DashboardLayout`) | **Protected** | Quick event/job application creation form |
| `/privacy` | `PrivacyPage` | Public | Platform privacy policy |
| `/404` | `NotFound` | Public | Fallback 404 page |

---

## 7. FRONTEND ARCHITECTURE

### Component Hierarchy
```
App
 └── ThemeProvider
      └── AuthProvider
           └── Router
                ├── LandingPage
                ├── LoginPage
                ├── OAuthSuccessPage
                └── DashboardLayout (Wraps Home, PlacementsPage, AddEventPage)
                     ├── Sidebar & Top Navigation Header
                     ├── DashboardView
                     │    ├── Stats Overview Cards
                     │    ├── Action Items & Priority Badges
                     │    ├── Recent Applications List (ApplicationCard)
                     │    └── Analytics Charts (AnalyticsDashboard)
                     ├── CalendarView (Month/Week Calendar grid for deadlines & interviews)
                     ├── KanbanView (Drag-and-drop / Column status board)
                     ├── RoutineView (Interactive habit tracker with streak metrics)
                     ├── PlacementsPage (PlacementTable, PlacementCard, Add/Edit Placement Modals)
                     ├── SkillsPage / AddSkillModal (Category-grouped skills matrix)
                     └── AddApplicationModal / ApplicationProfileForm
```

### State Management Strategy
1. **Authentication State (`useAuth.ts`)**: Manages `user`, `token`, `isAuthenticated`, backend readiness warm-up status, and automatic token attachment.
2. **Theme Context (`ThemeContext.tsx`)**: Controls global CSS theme classes (`dark`, `light`, `glass`).
3. **Data Caching & Invalidation (`@tanstack/react-query`)**: Every component utilizes React Query hooks (e.g. `useQuery`, `useMutation`) with invalidation keys (`['applications']`, `['placements']`, `['skills']`, `['routines']`, `['analytics']`) to guarantee real-time UI synchronization without full page reloads.

---

## 8. BACKEND ARCHITECTURE

### Key Modules & Responsibilities
- **`config/`**: Configures CORS origins, Swagger documentation endpoints, and custom Spring Beans.
- **`security/`**: `JwtAuthenticationFilter` intercepts HTTP requests, decodes Bearer tokens via `JwtTokenProvider`, loads `UserPrincipal` into Spring's `SecurityContextHolder`.
- **`controller/`**: Accepts JSON payloads, enforces DTO validation using `@Valid`, and delegates execution to services.
- **`service/`**: Implements core domain business rules, handles multi-table JPA transactions (`@Transactional`), and communicates with Gemini AI.
- **`repository/`**: Extends `JpaRepository<T, ID>` with custom JPQL queries for analytics, stats, and search filtering.

---

## 9. DATABASE ARCHITECTURE

The application uses PostgreSQL with 7 primary tables created via `schema.sql`:

```
┌────────────────┐          ┌────────────────────┐
│     users      │1 ────── 1│   user_profiles    │
└───────┬────────┘          └────────────────────┘
        │
        │1
        ├──────────────────────┬──────────────────────┬──────────────────────┐
        │*                     │*                     │*                     │*
┌───────▼────────┐     ┌───────▼────────┐     ┌───────▼────────┐     ┌───────▼────────┐
│  applications  │     │   placements   │     │     skills     │     │ routine_tasks  │
└────────────────┘     └────────────────┘     └────────────────┘     └───────┬────────┘
                                                                             │1
                                                                             │*
                                                                     ┌───────▼────────────┐
                                                                     │ routine_completion │
                                                                     └────────────────────┘
```

---

## 10. AUTHENTICATION & AUTHORIZATION FLOW

1. **Local Authentication**: User posts email/password to `/api/auth/login` or `/api/auth/register`. Password verified with `BCryptPasswordEncoder`. JWT issued and saved to `localStorage`.
2. **OAuth2 Authentication**: User clicks "Login with Google" or "Login with GitHub". Redirects to Spring Security OAuth2 handler (`/oauth2/authorization/google`). Upon success, `OAuth2LoginSuccessHandler` generates a JWT token and redirects client browser to `/oauth-success?token=<JWT>`.
3. **Request Authorization**: Client attaches `Authorization: Bearer <token>` header to all REST calls. `JwtAuthenticationFilter` authenticates the token on every request.

---

## 11. API INVENTORY SUMMARY

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Applications**: `/api/applications` (GET, POST), `/api/applications/{id}` (GET, PUT, DELETE), `/api/applications/{id}/status` (PATCH)
- **Placements**: `/api/placements` (GET, POST), `/api/placements/{id}` (GET, PUT, DELETE)
- **Skills**: `/api/skills` (GET, POST), `/api/skills/{id}` (PUT, DELETE)
- **Routines**: `/api/routines/tasks` (GET, POST, DELETE), `/api/routines/completions` (POST)
- **Analytics**: `/api/analytics/dashboard`, `/api/analytics/funnel`
- **Import / AI**: `/api/import/extract-url` (POST - Gemini AI URL extraction)
- **Profile**: `/api/profile` (GET, PUT)

---

## 12. ENVIRONMENT VARIABLES

### Root / Backend `.env`
- `DB_PASSWORD`: PostgreSQL password
- `JWT_SECRET`: 256-bit secret key for signing JWT tokens
- `FRONTEND_URL`: URL of the deployed frontend (e.g. `http://localhost:5173`)
- `CORS_ALLOWED_ORIGINS`: Allowed origins for CORS filter
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth2 client secrets
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: OAuth2 client secrets
- `GEMINI_API_KEY`: API key for Google Gemini AI service
- `MAIL_USERNAME` / `MAIL_PASSWORD`: SMTP credentials for notification emails

### Frontend `apps/web/.env`
- `VITE_API_BASE_URL`: Base backend URL (defaults to `http://localhost:8080/api` in dev)

---

## 13. DEPENDENCY & IMPACT ANALYSIS

### High-Impact Critical Files
- **`apps/backend/src/main/java/com/eventtracker/security/SecurityConfig.java`**: Configures all endpoint authorization rules and filter ordering.
- **`apps/backend/src/main/java/com/eventtracker/service/GeminiExtractionService.java`**: Crucial service handling AI parsing; failure degrades smart job import.
- **`apps/web/src/App.tsx`**: Route guard and authentication readiness state routing.
- **`apps/web/src/lib/restClient.ts`**: Axios instance configuration, base URL, and Bearer token interceptor.

---

## 14. PERFORMANCE & TECHNICAL DEBT NOTES

### Strengths
- Fast client-side performance using React 19, Vite, and Wouter.
- Indexed PostgreSQL queries on `user_id`, `status`, and unique constraints preventing duplicate application links.
- Graceful backend warm-up loader handling cold starts (e.g., Render free tier instances).

### Technical Debt / Areas for Enhancement
- **In-Memory Cache missing**: Analytics service computes aggregates dynamically; adding Spring Cache or Redis could boost performance under heavy user loads.
- **Monorepo Script Integration**: Root `package.json` relies on standard npm workspaces; migrating to Turborepo (`turbo.json`) would optimize concurrent build caching.
