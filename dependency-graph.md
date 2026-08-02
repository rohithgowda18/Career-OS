# DEPENDENCY GRAPH & CRITICAL FILE MATRIX — CAREER OS

## 1. FRONTEND DEPENDENCY GRAPH

```
App.tsx
 ├── contexts/ThemeContext.tsx
 ├── hooks/useAuth.ts
 │    └── lib/api/authApi.ts ──> lib/restClient.ts
 ├── components/ErrorBoundary.tsx
 ├── pages/LandingPage.tsx
 ├── pages/LoginPage.tsx
 ├── pages/OAuthSuccessPage.tsx
 └── pages/Home.tsx (Dashboard View)
      ├── components/DashboardLayout.tsx
      │    ├── components/views/DashboardView.tsx
      │    │    ├── components/ApplicationCard.tsx
      │    │    └── components/AnalyticsDashboard.tsx
      │    │         └── lib/api/analyticsApi.ts
      │    ├── components/views/CalendarView.tsx
      │    ├── components/views/KanbanView.tsx
      │    │    └── lib/api/applicationsApi.ts
      │    ├── components/views/RoutineView.tsx
      │    │    └── lib/api/routineApi.ts
      │    └── pages/SkillsPage.tsx
      │         ├── components/SkillTable.tsx
      │         └── components/AddSkillModal.tsx
      └── components/AddApplicationModal.tsx
           └── lib/api/importApi.ts
```

---

## 2. BACKEND DEPENDENCY GRAPH

```
EventAppTrackerApplication.java
 ├── security/SecurityConfig.java
 │    ├── security/JwtAuthenticationFilter.java
 │    │    └── security/JwtTokenProvider.java
 │    └── security/oauth/OAuth2LoginSuccessHandler.java
 ├── controller/AuthController.java ───────► service/UserService.java
 ├── controller/ApplicationController.java ─► service/ApplicationService.java
 ├── controller/PlacementController.java ──► service/PlacementService.java
 ├── controller/SkillController.java ──────► service/SkillService.java
 ├── controller/RoutineController.java ────► service/RoutineService.java
 ├── controller/AnalyticsController.java ──► service/AnalyticsService.java
 ├── controller/ImportController.java ─────► service/GeminiExtractionService.java
 └── controller/ProfileController.java ────► service/ProfileService.java
                                                     │
                                                     ▼
                                      repository/* (JPA Interfaces)
                                                     │
                                                     ▼
                                      entity/* (JPA Models) ──> DB
```

---

## 3. HIGH IMPACT & CRITICAL CODEBASE FILES

The following files represent core foundational infrastructure. Any breaking modification or untested change in these files will cascade failures across multiple modules:

### 3.1 Backend Critical Files

1. **`apps/backend/src/main/java/com/eventtracker/security/SecurityConfig.java`**
   - **Role**: Defines security filter chain, CORS policy, public/private route access rules, and JWT filter order.
   - **Risk Level**: **CRITICAL**. Edits can expose protected endpoints or block authorized client requests.

2. **`apps/backend/src/main/java/com/eventtracker/security/JwtTokenProvider.java`**
   - **Role**: Handles JWT signature generation, expiration enforcement, and token decoding.
   - **Risk Level**: **HIGH**. Key format or algorithm changes will immediately invalidate active user sessions.

3. **`apps/backend/src/main/java/com/eventtracker/service/GeminiExtractionService.java`**
   - **Role**: AI parsing engine extracting structured JSON from external web links.
   - **Risk Level**: **HIGH**. Relies on prompt engineering and model availability (`gemini-2.5-flash`).

4. **`apps/backend/src/main/resources/schema.sql`**
   - **Role**: Database DDL defining tables, foreign keys, unique indices, and constraints.
   - **Risk Level**: **HIGH**. Unchecked SQL migration edits can corrupt production databases or fail startup.

---

### 3.2 Frontend Critical Files

1. **`apps/web/src/App.tsx`**
   - **Role**: Core application router, route protection middleware, and backend server warm-up loader.
   - **Risk Level**: **CRITICAL**. Errors break client routing or trap users in infinite redirect loops.

2. **`apps/web/src/hooks/useAuth.ts`**
   - **Role**: Global authentication state, session validation, token storage, and backend health polling.
   - **Risk Level**: **CRITICAL**. Any regression causes silent logouts or unauthenticated API access.

3. **`apps/web/src/lib/restClient.ts`**
   - **Role**: Base Axios instance injecting `Authorization: Bearer <token>` into every API call.
   - **Risk Level**: **CRITICAL**. Header misconfiguration breaks all REST backend communication.

4. **`apps/web/src/components/DashboardLayout.tsx`**
   - **Role**: Primary layout container housing side navigation, theme toggles, and view rendering.
   - **Risk Level**: **MEDIUM-HIGH**. Structural edits affect desktop and mobile responsive viewports.
