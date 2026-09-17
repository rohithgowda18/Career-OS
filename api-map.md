# Career OS — Complete REST API Catalog & Endpoint Inventory

> **File:** `api-map.md`  
> **Status:** Ground Truth System Specification  
> **Total Active Endpoints:** 33  
> **Version:** 2.0 (Microservices Architecture)  

---

## 1. Authentication & User Profile Service (Port 8081 — `career-os-auth-service`)

| Method | Endpoint Route | Purpose | Input / Request Payload | Output / Response Schema | Used By (Frontend / Consumer) | Database Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | JSON Body: `{ email, password, displayName? }` | `201 Created`: `{ token, expiresIn, user: UserDTO }`<br>`409 Conflict`: Duplicate email | `LoginPage.tsx` (Sign Up tab) | Writes `users` table |
| `POST` | `/api/auth/login` | Authenticate user via email & password | JSON Body: `{ email, password }` | `200 OK`: `{ token, expiresIn, user: UserDTO }`<br>`401 Unauthorized`: Bad credentials | `LoginPage.tsx` (Sign In tab) | Reads `users` table |
| `GET` | `/api/auth/me` | Fetch authenticated user's session profile | Bearer Token in `Authorization` header | `200 OK`: `UserDTO { id, email, displayName, role }`<br>`401 Unauthorized` | `useAuth.tsx` (`meQuery`) | Reads `users` table |
| `PUT` | `/api/auth/me/display-name`| Update authenticated user's name | Bearer Token + JSON: `{ displayName }` | `200 OK`: `UserDTO` | `ApplicationProfileForm.tsx` | Updates `users` table |
| `POST` | `/api/auth/logout` | Invalidate current session context | Bearer Token in `Authorization` header | `200 OK`: `"Logout successful"` | `useAuth.tsx` (`logout()`) | None (Stateless) |
| `GET` | `/api/profile` | Retrieve extended user profile | Bearer Token in `Authorization` header | `200 OK`: `UserProfileDTO { college, skills, githubUrl, linkedinUrl, portfolioUrl, location, emailAlerts, weeklyDigest }` | `ApplicationProfileForm.tsx` | Reads `user_profiles` table |
| `PUT` | `/api/profile` | Update extended user profile & alerts | Bearer Token + JSON: `UserProfileDTO` | `200 OK`: Updated `UserProfileDTO` | `ApplicationProfileForm.tsx` | Upserts `user_profiles` table |
| `GET` | `/oauth2/authorization/{provider}`| Trigger OAuth2 login redirect | Path parameter: `google` or `github` | `302 Found`: Redirects to Google/GitHub consent screen | `LoginPage.tsx` (Social buttons) | None |
| `GET` | `/login/oauth2/code/{provider}` | OAuth2 callback from identity provider | Provider OAuth authorization code | Redirect to `/oauth-success?token={JWT}` | Google / GitHub identity servers | Upserts `users` table |
| `GET` | `/actuator/health` | Health check endpoint | None | `200 OK`: `{ status: "UP" }` | Eureka, Docker Compose, API Gateway | None |

---

## 2. Core Career Backend Service (Port 8085 — `career-os`)

### 2.1 Applications Domain (`/api/applications`)

| Method | Endpoint Route | Purpose | Input / Request Payload | Output / Response Schema | Used By (Frontend) | Database Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/applications` | Paginated & filtered list of events | Params: `status?`, `eventType?`, `page`, `size`, `sort` | `200 OK`: `Page<ApplicationDTO>` | `CalendarView.tsx`, `DashboardView.tsx` | Reads `applications` table |
| `GET` | `/api/applications/{id}` | Retrieve application by ID | Path parameter: `id` | `200 OK`: `ApplicationDTO`<br>`404 Not Found` | Application detail modals | Reads `applications` table |
| `POST` | `/api/applications` | Create new career event / hackathon | JSON: `ApplicationDTO { eventName, eventType, status, deadline, notes, eventUrl, location }` | `201 Created`: `ApplicationDTO`<br>`400 Bad Request` (e.g. duplicate URL) | `AddApplicationModal.tsx`, `AddEventPage.tsx` | Writes `applications` table |
| `PUT` | `/api/applications/{id}` | Update existing application | Path `id` + JSON: `ApplicationDTO` | `200 OK`: `ApplicationDTO`<br>`404 Not Found` | Edit Application modal | Updates `applications` table |
| `DELETE`| `/api/applications/{id}` | Delete an application | Path parameter: `id` | `200 OK`: `"Application deleted successfully"` | Application cards / actions | Deletes from `applications` table |
| `POST` | `/api/applications/extract`| AI parse event details from email | JSON: `{ emailContent: string }` (max 10k chars) | `200 OK`: `ApplicationDTO` | `AddApplicationModal.tsx` | Delegates via OpenFeign to `:8082` |

---

### 2.2 Placements Domain (`/api/placements`)

| Method | Endpoint Route | Purpose | Input / Request Payload | Output / Response Schema | Used By (Frontend) | Database Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/placements` | Paginated list of placements | Params: `status?`, `page`, `size`, `sort` | `200 OK`: `Page<PlacementDTO>` | `PlacementsPage.tsx`, `PlacementTable.tsx`, `KanbanView.tsx` | Reads `placements` table |
| `GET` | `/api/placements/{id}` | Retrieve placement by ID | Path parameter: `id` | `200 OK`: `PlacementDTO`<br>`404 Not Found` | Detail / Edit modal | Reads `placements` table |
| `POST` | `/api/placements` | Create new placement opportunity | JSON: `PlacementDTO { companyName, role, location, stipend, ctc, applicationLink, assessmentDate, interviewDate, status }` | `201 Created`: `PlacementDTO` | `AddPlacementModal.tsx` | Writes `placements` table |
| `PUT` | `/api/placements/{id}` | Update placement details / status | Path `id` + JSON: `PlacementDTO` | `200 OK`: `PlacementDTO`<br>`404 Not Found` | `EditPlacementModal.tsx`, `KanbanView.tsx` | Updates `placements` table |
| `DELETE`| `/api/placements/{id}` | Delete a placement record | Path parameter: `id` | `200 OK`: `"Placement deleted successfully"` | Placement card / table actions | Deletes from `placements` table |
| `POST` | `/api/placements/extract` | AI parse placement from email | JSON: `{ emailContent: string }` | `200 OK`: `PlacementDTO` | `AddPlacementModal.tsx` | Delegates via OpenFeign to `:8082` |

---

### 2.3 Daily Routines & Habits Domain (`/api/routines`)

| Method | Endpoint Route | Purpose | Input / Request Payload | Output / Response Schema | Used By (Frontend) | Database Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/routines` | List recurring routines with today's status | None | `200 OK`: `List<RoutineDTO>` | `RoutineView.tsx`, `DashboardView.tsx` | Reads `routine_tasks` & joins `routine_completion` |
| `POST` | `/api/routines` | Create a new recurring habit task | JSON: `{ title, displayOrder? }` | `201 Created`: `RoutineDTO` | `RoutineView.tsx` | Writes `routine_tasks` table |
| `PUT` | `/api/routines/{id}` | Update routine title / order | Path `id` + JSON: `RoutineDTO` | `200 OK`: `RoutineDTO` | `RoutineView.tsx` | Updates `routine_tasks` table |
| `PUT` | `/api/routines/{id}/toggle` | Toggle completion status for today | Path parameter: `id` | `200 OK`: `{ completed: boolean }` | Checkboxes in `RoutineView.tsx` & `DashboardView.tsx` | Upserts `routine_completion` (idempotent per date) |
| `DELETE`| `/api/routines/{id}` | Delete a routine task | Path parameter: `id` | `200 OK`: `{ message: "Task deleted successfully" }` | `RoutineView.tsx` | Deletes `routine_tasks` (cascades completions) |
| `GET` | `/api/routines/reports` | Get weekly habit stats & streak metrics | None | `200 OK`: `RoutineReportDTO { weeklyCompletion, weeklyAverage, currentStreak, longestStreak, bestDay }` | `RoutineView.tsx`, `DashboardView.tsx` | Aggregates `routine_completion` records |

---

### 2.4 Skills Portfolio Domain (`/api/skills`)

| Method | Endpoint Route | Purpose | Input / Request Payload | Output / Response Schema | Used By (Frontend) | Database Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/skills` | List skills with search & pagination | Params: `search?`, `page`, `size`, `sort` | `200 OK`: `Page<SkillDTO>` | `SkillsPage.tsx`, `SkillTable.tsx` | Reads `skills` table |
| `GET` | `/api/skills/{id}` | Get a single skill by ID | Path parameter: `id` | `200 OK`: `SkillDTO`<br>`404 Not Found` | Skill edit modal | Reads `skills` table |
| `POST` | `/api/skills` | Add a new technical skill | JSON: `CreateSkillRequest { name, category, level }` | `201 Created`: `SkillDTO`<br>`400 Bad Request` (duplicate skill) | `AddSkillModal.tsx`, `SkillsPage.tsx` | Writes `skills` table |
| `PUT` | `/api/skills/{id}` | Update skill category or proficiency | Path `id` + JSON: `UpdateSkillRequest` | `200 OK`: `SkillDTO`<br>`404 Not Found` | `EditCategorySkillsModal.tsx` | Updates `skills` table |
| `DELETE`| `/api/skills/{id}` | Delete a skill | Path parameter: `id` | `200 OK`: `"Skill deleted successfully"` | `SkillTable.tsx` | Deletes from `skills` table |

---

### 2.5 Analytics Domain (`/api/analytics`)

| Method | Endpoint Route | Purpose | Input / Request Payload | Output / Response Schema | Used By (Frontend) | Database Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/applications` | Metrics for hackathons / events | None | `200 OK`: `{ totalApplications, statusBreakdown, upcomingDeadlinesCount }` | `AnalyticsDashboard.tsx` | Aggregates `applications` |
| `GET` | `/api/analytics/placements` | Placement pipeline metrics | None | `200 OK`: `{ totalPlacements, applied, assessmentScheduled, interviewScheduled, offerReceived, rejected, conversionRate }` | `PlacementsPage.tsx`, `AnalyticsDashboard.tsx` | Aggregates `placements` |
| `GET` | `/api/analytics/placements/trends`| Placement monthly volume trend | None | `200 OK`: `List<{ month: string, count: number, offers: number }>` | `AnalyticsDashboard.tsx` | Date truncation query on `placements` |
| `GET` | `/api/analytics/dashboard` | Aggregated command center metrics | None | `200 OK`: `DashboardMetricsDTO { totalApplications, deadlinesTodayCount, interviewsThisWeek, awaitingResponses, offersAwaitingDecision }` | `DashboardView.tsx` | Cross-aggregates `applications` & `placements` |

---

## 3. Generative AI Extraction Service (Port 8082 — `ai-extraction-service`)

| Method | Endpoint Route | Purpose | Input / Request Payload | Output / Response Schema | Used By (Service / Client) | Database Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/extraction/placement` | Extract job offer / placement info from raw text | JSON: `{ emailContent: string }` | `200 OK`: `PlacementDTO` | Backend (`AiExtractionClient.java`) & Direct Gateway | None (Calls Gemini LLM) |
| `POST` | `/api/extraction/application` | Extract hackathon / event info from raw text | JSON: `{ emailContent: string }` | `200 OK`: `ApplicationDTO` | Backend (`AiExtractionClient.java`) & Direct Gateway | None (Calls Gemini LLM) |
| `GET` | `/actuator/health` | Health check endpoint | None | `200 OK`: `{ status: "UP" }` | Eureka, Docker Compose | None |

---

## 4. API Gateway Service (Port 8080 — `api-gateway`)

| Method | Endpoint Route | Purpose | Input / Request Payload | Output / Response Schema | Used By (Consumer) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/actuator/health` | Gateway instance health check | None | `200 OK`: `{ status: "UP" }` | Frontend warm-up ping in `App.tsx` |
| `GET` | `/actuator/gateway/routes` | View active routes resolved by Eureka | None (Admin) | `200 OK`: Active route predicate list | Dev & Observability |
