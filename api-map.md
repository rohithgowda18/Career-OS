# API INVENTORY & SERVICE MAP — CAREER OS

## 1. API OVERVIEW & SECURITY CONTEXT

All backend REST API endpoints are exposed under `/api/*` and hosted by `apps/backend`.
Authentication is enforced via `Bearer <JWT_TOKEN>` header for all protected endpoints.

- **Base URL (Local)**: `http://localhost:8080/api`
- **Base URL (Prod)**: Specified via `VITE_API_BASE_URL` (Render deployment backend)
- **Actuator Health Check**: `/actuator/health` (Public - used by frontend warm-up loader)

---

## 2. API ENDPOINTS TABLE

### 2.1 Authentication & User Management (`AuthController.java`)
| Method | Route | Security | Controller Method | Purpose / Function | Used By Frontend File |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | `registerUser()` | Registers new user account with BCrypt hashed password | `apps/web/src/pages/LoginPage.tsx` |
| `POST` | `/api/auth/login` | Public | `authenticateUser()` | Validates credentials and returns signed JWT token | `apps/web/src/pages/LoginPage.tsx` |
| `GET` | `/api/auth/me` | Protected | `getCurrentUser()` | Fetches current logged-in user profile details | `apps/web/src/hooks/useAuth.ts` |
| `GET` | `/oauth2/authorization/{provider}` | Public | Spring OAuth2 | Initiates OAuth2 flow (Google / GitHub) | `apps/web/src/pages/LoginPage.tsx` |

### 2.2 Applications API (`ApplicationController.java`)
| Method | Route | Security | Controller Method | Purpose / Function | Used By Frontend File |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/applications` | Protected | `getAllApplications()` | Retrieves all applications belonging to current user | `apps/web/src/lib/api/applicationsApi.ts` |
| `POST` | `/api/applications` | Protected | `createApplication()` | Creates new job application entry | `apps/web/src/components/AddApplicationModal.tsx` |
| `GET` | `/api/applications/{id}` | Protected | `getApplicationById()` | Gets details for specific application | `apps/web/src/lib/api/applicationsApi.ts` |
| `PUT` | `/api/applications/{id}` | Protected | `updateApplication()` | Updates application details | `apps/web/src/components/ApplicationCard.tsx` |
| `PATCH` | `/api/applications/{id}/status` | Protected | `updateStatus()` | Fast status updates (Kanban drag-and-drop) | `apps/web/src/components/views/KanbanView.tsx` |
| `DELETE` | `/api/applications/{id}` | Protected | `deleteApplication()` | Deletes application entry | `apps/web/src/components/ApplicationCard.tsx` |

### 2.3 Placements API (`PlacementController.java`)
| Method | Route | Security | Controller Method | Purpose / Function | Used By Frontend File |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/placements` | Protected | `getAllPlacements()` | Fetches campus placement drives for user | `apps/web/src/lib/api/placementsApi.ts` |
| `POST` | `/api/placements` | Protected | `createPlacement()` | Creates new placement drive record | `apps/web/src/components/AddPlacementModal.tsx` |
| `GET` | `/api/placements/{id}` | Protected | `getPlacementById()` | Fetches single placement entry | `apps/web/src/lib/api/placementsApi.ts` |
| `PUT` | `/api/placements/{id}` | Protected | `updatePlacement()` | Updates placement drive details | `apps/web/src/components/EditPlacementModal.tsx` |
| `DELETE` | `/api/placements/{id}` | Protected | `deletePlacement()` | Deletes placement entry | `apps/web/src/components/PlacementCard.tsx` |

### 2.4 Skills API (`SkillController.java`)
| Method | Route | Security | Controller Method | Purpose / Function | Used By Frontend File |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/skills` | Protected | `getAllSkills()` | Gets all skills grouped by category | `apps/web/src/lib/api/skillsApi.ts` |
| `POST` | `/api/skills` | Protected | `createSkill()` | Adds a new skill to user matrix | `apps/web/src/components/AddSkillModal.tsx` |
| `PUT` | `/api/skills/{id}` | Protected | `updateSkill()` | Updates existing skill level / category | `apps/web/src/components/EditCategorySkillsModal.tsx` |
| `DELETE` | `/api/skills/{id}` | Protected | `deleteSkill()` | Deletes skill from matrix | `apps/web/src/components/SkillTable.tsx` |

### 2.5 Routine Tasks API (`RoutineController.java`)
| Method | Route | Security | Controller Method | Purpose / Function | Used By Frontend File |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/routines/tasks` | Protected | `getTasks()` | Fetches user's daily routine habit tasks | `apps/web/src/lib/api/routineApi.ts` |
| `POST` | `/api/routines/tasks` | Protected | `createTask()` | Creates new routine habit task | `apps/web/src/components/views/RoutineView.tsx` |
| `DELETE` | `/api/routines/tasks/{id}` | Protected | `deleteTask()` | Removes routine task | `apps/web/src/components/views/RoutineView.tsx` |
| `POST` | `/api/routines/completions` | Protected | `toggleCompletion()` | Toggles daily completion check for task | `apps/web/src/components/views/RoutineView.tsx` |
| `GET` | `/api/routines/completions` | Protected | `getCompletions()` | Fetches history of completions for date range | `apps/web/src/lib/api/routineApi.ts` |

### 2.6 Analytics API (`AnalyticsController.java`)
| Method | Route | Security | Controller Method | Purpose / Function | Used By Frontend File |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/analytics/dashboard` | Protected | `getDashboardStats()` | Computes application response rate, counts & metrics | `apps/web/src/components/AnalyticsDashboard.tsx` |
| `GET` | `/api/analytics/funnel` | Protected | `getFunnelMetrics()` | Computes conversion rates across status stages | `apps/web/src/components/AnalyticsDashboard.tsx` |

### 2.7 AI Import Extraction API (`ImportController.java`)
| Method | Route | Security | Controller Method | Purpose / Function | Used By Frontend File |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/api/import/extract-url` | Protected | `extractFromUrl()` | Scrapes job posting URL and parses fields via Gemini AI | `apps/web/src/pages/AddEventPage.tsx` |

### 2.8 User Profile API (`ProfileController.java`)
| Method | Route | Security | Controller Method | Purpose / Function | Used By Frontend File |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/profile` | Protected | `getProfile()` | Fetches user profile autofill data | `apps/web/src/lib/api/userApi.ts` |
| `PUT` | `/api/profile` | Protected | `updateProfile()` | Updates college, links, skills autofill settings | `apps/web/src/components/ApplicationProfileForm.tsx` |
