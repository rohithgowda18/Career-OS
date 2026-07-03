# FEATURE MATRIX
### Career OS — Event & Placement Tracker
**Based on: 100% source code audit. No features hallucinated.**

---

| Feature | Description | Implemented | Files Responsible | Difficulty | Complexity | Production Ready | Notes |
|---|---|---|---|---|---|---|---|
| **User Registration** | Email + password account creation. Normalizes email to lowercase. BCrypt hashes password. Creates blank user profile automatically. | YES | AuthController.java, UserService.java, UserRepository.java, authApi.ts, LoginPage.tsx | Beginner | Low | YES | DuplicateUserException thrown on conflict |
| **Email/Password Login** | Authenticate with credentials. Returns JWT (HS512, 30-min expiry) and user DTO. | YES | AuthController.java, UserService.java, JwtTokenProvider.java, authApi.ts | Beginner | Low | YES | No rate limiting — brute-force risk |
| **Google OAuth2 Login** | Redirect-based OAuth2 login via Google. Auto-provisions user. Returns JWT via redirect. | YES | SecurityConfig.java, OAuth2LoginSuccessHandler.java, LoginPage.tsx, OAuthSuccessPage.tsx | Intermediate | Medium | YES | Uses Spring OAuth2 client |
| **GitHub OAuth2 Login** | Redirect-based OAuth2 login via GitHub. Falls back to login attribute if email not available. | YES | SecurityConfig.java, OAuth2LoginSuccessHandler.java, LoginPage.tsx | Intermediate | Medium | YES | GitHub email scope required |
| **JWT Authentication** | Stateless token validation on every protected request via OncePerRequestFilter. | YES | JwtAuthenticationFilter.java, JwtTokenProvider.java, SecurityConfig.java | Intermediate | Medium | PARTIAL | No token blacklist on logout; no refresh token |
| **Current User Endpoint** | GET /api/auth/me returns authenticated user DTO from SecurityContext. | YES | AuthController.java, useAuth.ts | Beginner | Low | YES | Used by frontend useAuth hook |
| **Logout** | POST /api/auth/logout clears SecurityContext server-side. Frontend clears localStorage token. | YES | AuthController.java, useAuth.ts | Beginner | Low | PARTIAL | Token remains valid until expiry — no invalidation |
| **Event Application CRUD** | Full create/read/update/delete for event applications (hackathons, workshops, conferences, internships). | YES | ApplicationController.java, ApplicationService.java, ApplicationRepository.java, ApplicationDTO.java, Application.java | Intermediate | Medium | YES | Input validation on DTOs |
| **Application Status Tracking** | Track status through: Interested -> Applied -> UnderReview -> Accepted -> Rejected | YES | Application.java (enum), ApplicationService.java, ApplicationDTO.java | Beginner | Low | YES | Status stored as VARCHAR enum name |
| **Application Event Types** | Categorize as: Hackathon, Workshop, Conference, Internship, Other | YES | Application.java (enum), ApplicationService.java | Beginner | Low | YES | |
| **Application Deadline Tracking** | Optional deadline field (LocalDateTime). Frontend computes urgency colors (red/yellow/gray). | YES | Application.java, ApplicationDTO.java, getDeadlineStatus.ts | Beginner | Low | YES | Countdown shown in UI |
| **URL Normalization & Deduplication** | Normalizes event URLs (lowercase domain, strip query params/trailing slash). Prevents saving duplicate events by URL. | YES | ApplicationService.java (normalizeUrl), ApplicationRepository.findByUserIdAndUrl | Intermediate | Medium | YES | DuplicateEventException on conflict |
| **Application Search** | Full-text search on event_name, location, notes via JPQL LIKE query. Case-insensitive. | YES | ApplicationRepository.java (findFiltered JPQL), ApplicationService.getUserApplications | Intermediate | Medium | YES | Pageable + status filter combined |
| **Application Pagination** | Paginated list endpoint with Spring Pageable. Frontend uses page/size/sort params. | YES | ApplicationController.java, ApplicationRepository.java, applicationsApi.ts | Intermediate | Low | YES | Default sort: deadline ASC |
| **Placement CRUD** | Full create/read/update/delete for placement/job applications. | YES | PlacementController.java, PlacementService.java, PlacementRepository.java, PlacementDTO.java, Placement.java | Intermediate | Medium | YES | |
| **Placement Status Pipeline** | 7-stage pipeline: APPLIED -> ASSESSMENT_SCHEDULED -> ASSESSMENT_COMPLETED -> INTERVIEW_SCHEDULED -> INTERVIEW_COMPLETED -> OFFER_RECEIVED -> REJECTED | YES | PlacementStatus.java (enum), Placement.java, PlacementService.java | Intermediate | Low | YES | More granular than application status |
| **Placement Financial Fields** | Track stipend and CTC as string fields (not numeric). | YES | Placement.java, PlacementDTO.java | Beginner | Low | YES | String type limits financial queries |
| **Placement Date Tracking** | Optional assessment_date and interview_date fields. | YES | Placement.java, PlacementDTO.java | Beginner | Low | YES | |
| **Placement Deduplication** | Unique constraint on (user_id, company_name, role, application_link). App-layer check before save. | YES | PlacementRepository.java (findDuplicate), PlacementService.java, schema.sql | Intermediate | Medium | YES | DuplicatePlacementException on conflict |
| **Placement URL Normalization** | Same normalizeUrl logic as ApplicationService applied to application_link. | YES | PlacementService.java (normalizeUrl) | Intermediate | Low | YES | DRY violation — duplicated from ApplicationService |
| **Placement Search** | Full-text search on company_name, role, location via JPQL LIKE query. | YES | PlacementRepository.java (findFiltered JPQL) | Intermediate | Medium | YES | |
| **Placement Pagination** | Paginated list with default sort id DESC. | YES | PlacementController.java, PlacementRepository.java | Intermediate | Low | YES | |
| **AI Email Extraction (Gemini)** | Paste recruiter email -> Gemini 2.5 Flash extracts structured placement data (company, role, stipend, CTC, dates, link) as JSON. | YES | GeminiExtractionService.java, PlacementController.java, placementsApi.ts | Advanced | High | YES | 3-attempt retry with backoff, reflection-based schema |
| **AI Retry Logic** | Up to 3 attempts with 1s/2s/3s backoff on transient Gemini failures. Permanent errors (404) fail immediately. | YES | GeminiExtractionService.java | Advanced | Medium | YES | |
| **AI URL Preservation** | Post-processes Gemini response to match/preserve exact URLs from source email text. | YES | GeminiExtractionService.java (extractUrlsFromText) | Advanced | Medium | YES | |
| **User Profile** | Store college, skills (TEXT), GitHub URL, LinkedIn URL, portfolio URL, location. One profile auto-created on registration. | YES | UserProfile.java, UserProfileDTO.java, ProfileService.java, ProfileController.java | Beginner | Low | YES | |
| **Email Alert Preferences** | email_alerts (default true) and weekly_digest (default false) Boolean columns stored in user_profiles. | YES | UserProfile.java, UserProfileDTO.java, ProfileService.java | Beginner | Low | PARTIAL | DB columns and UI exist; no backend scheduler wires these |
| **Application Analytics - Summary** | Total applications, accepted, underReview, applied, interested, rejected counts + acceptance rate. | YES | AnalyticsService.getSummary, AnalyticsController, analyticsApi.ts | Intermediate | Medium | YES | Stream aggregation (not SQL GROUP BY) |
| **Application Analytics - Status Distribution** | Map of status -> count for chart rendering. | YES | AnalyticsService.getStatusDistribution, AnalyticsController | Intermediate | Low | YES | |
| **Application Analytics - Conversion Rates** | Acceptance rates per event type (Hackathon/Workshop etc). | YES | AnalyticsService.getAcceptanceRates, AnalyticsController | Intermediate | Medium | YES | |
| **Dashboard Analytics** | Aggregate: total apps, upcoming deadlines (7-day window), status distribution, 5 recent activities, 5 immediate deadlines. | YES | AnalyticsService.getDashboardData, AnalyticsController | Intermediate | Medium | YES | Returns raw Application entities (not DTOs) |
| **Placement Analytics - Summary** | Total placements by all status stages. | YES | AnalyticsService.getPlacementSummary, AnalyticsController | Intermediate | Low | YES | |
| **Placement Analytics - Status Distribution** | Map of PlacementStatus -> count. | YES | AnalyticsService.getPlacementStatusDistribution, AnalyticsController | Intermediate | Low | YES | |
| **Placement Analytics - Conversion Rates** | Assessment, interview, offer conversion percentages. | YES | AnalyticsService.getPlacementConversionRates, AnalyticsController | Intermediate | Medium | YES | |
| **Placement Analytics - Trends** | Monthly placement counts grouped by YYYY-MM string. | YES | AnalyticsService.getPlacementTrends, AnalyticsController | Intermediate | Medium | YES | |
| **Dashboard View** | Main dashboard with stats cards, charts, upcoming deadlines, recent activity. | YES | DashboardView.tsx | Intermediate | High | YES | Largest single file: 29KB |
| **Kanban View** | Kanban board for event applications. | YES | KanbanView.tsx | Intermediate | High | YES | |
| **Calendar View** | Calendar grid displaying upcoming event deadlines. | YES | CalendarView.tsx | Intermediate | High | YES | |
| **Analytics Dashboard View** | Charts (bar, pie, area) for application and placement analytics. | YES | AnalyticsDashboard.tsx | Intermediate | High | YES | Uses Recharts |
| **User Profile Form** | Edit college, skills, URLs, notification preferences. | YES | ApplicationProfileForm.tsx | Beginner | Medium | YES | |
| **Add Application Page** | Dedicated page for creating new event applications. | YES | AddEventPage.tsx | Beginner | Medium | YES | |
| **Placements Page** | Separate page for placement tracking with table and kanban. | YES | PlacementsPage.tsx, PlacementTable.tsx, PlacementKanbanView.tsx | Intermediate | High | YES | |
| **Add Placement Modal** | Modal form for adding placements manually or via AI extraction. | YES | AddPlacementModal.tsx | Intermediate | High | YES | Calls Gemini extract endpoint |
| **Edit Placement Modal** | Edit existing placement records. | YES | EditPlacementModal.tsx | Intermediate | Medium | YES | |
| **Add Application Modal** | Modal form for adding event applications. | YES | AddApplicationModal.tsx | Intermediate | Medium | YES | |
| **Application Card** | Card component for displaying application details. | YES | ApplicationCard.tsx | Beginner | Low | YES | |
| **Placement Card** | Card component for placement details. | YES | PlacementCard.tsx | Beginner | Low | YES | |
| **Dark Theme** | Dark mode as default (hardcoded in App.tsx). ThemeContext supports toggle but App does not enable switchable. | YES | ThemeContext.tsx, App.tsx, index.css | Beginner | Low | YES | switchable=false in App.tsx |
| **PWA (Progressive Web App)** | App is installable as PWA on desktop/mobile. Workbox service worker caches static assets. | YES | vite.config.ts (VitePWA), sw.ts, usePWAInstall.ts | Intermediate | Medium | YES | manifest configured; icons referenced |
| **Error Boundary** | React ErrorBoundary component wraps entire app. | YES | ErrorBoundary.tsx | Beginner | Low | YES | |
| **404 Page** | Not found page for unmatched routes. | YES | NotFound.tsx | Beginner | Low | YES | |
| **Landing Page** | Marketing landing page (pre-login). | YES | LandingPage.tsx | Beginner | Medium | YES | |
| **OpenAPI / Swagger UI** | SpringDoc auto-generates Swagger UI at /swagger-ui/index.html | YES | OpenApiConfig.java, pom.xml (springdoc-openapi 2.3.0) | Beginner | Low | YES | Each endpoint has @Operation annotation |
| **SonarQube Integration** | GitHub Actions workflow runs SonarQube analysis on push to master/test. | YES | .github/workflows/build.yml | Beginner | Low | YES | Skips tests in CI |
| **Postman Collection** | postman-event-tracker-collection.json in root. | YES | postman-event-tracker-collection.json | Beginner | Low | YES | |
| **Email Service** | sendMail() method via JavaMailSender + Gmail SMTP configured. | YES | EmailService.java, application.yml | Intermediate | Low | NO | Service exists but no controller or scheduler calls it |
| **Email Alert Scheduler** | Scheduled job to send deadline alerts / weekly digest based on user preferences. | NO | — | — | — | NO | Preferences stored in DB but scheduler not implemented |
| **Bookmarklet Scraper** | README mentions a browser bookmarklet for auto-filling event data from portals like Unstop. | NO | No bookmarklet code found in repository | — | — | NO | Mentioned in README only; not implemented |
| **Password Reset / Forgot Password** | Password reset flow. | NO | — | — | — | NO | Not implemented |
| **Admin Role / Admin Dashboard** | Role column exists (USER/ADMIN) but no admin-specific controllers or UI. | NO | User.java has role field | — | — | NO | Role stored but not enforced differently |
| **Refresh Token** | Silent token renewal without re-login. | NO | — | — | — | NO | 30-min tokens expire with no refresh |
| **Rate Limiting** | Brute-force protection on login/register. | NO | — | — | — | NO | Security gap |
| **Database Migrations** | Flyway or Liquibase versioned migrations. | NO | schema.sql is manual | — | — | NO | schema.sql used instead |
| **Docker Compose** | Local full-stack orchestration. | NO | No docker-compose.yml found | — | — | NO | Backend has Dockerfile; no compose file |
| **Frontend Tests** | vitest.config.ts exists but zero test files. | NO | vitest.config.ts | — | — | NO | |
