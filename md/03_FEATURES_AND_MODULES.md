# 03 FEATURES AND MODULES

## API Documentation (Swagger)

The backend exposes OpenAPI documentation via Swagger UI at:
```
http://localhost:8080/swagger-ui.html
```
All Swagger endpoints are permitted in `SecurityConfig.java` for unauthenticated access.

This document outlines the core functional modules of the Event Application Tracker.

## 1. Authentication & Security Module
### Purpose
To securely identify users, protect routes, and ensure users can only see and manipulate their own application data. It provides traditional Email/Password login as well as frictionless OAuth2 flows.

### User Flow
1. User lands on `/` (Landing Page).
2. User clicks "Login" and is routed to `/auth/login`.
3. User enters credentials or clicks "Sign in with GitHub/Google".
4. Upon successful auth, user is redirected to the Dashboard.

### Internal Flow & APIs
- **Login:** POST `/auth/login` (Expects: email, password. Returns: JWT).
- **Register:** POST `/auth/register`.
- **OAuth:** `GET /oauth2/authorization/{provider}` redirects to identity provider. Handled by Spring Security's `OAuth2LoginAuthenticationFilter`. Success hits `OAuth2LoginSuccessHandler` which redirects to `/oauth-success?token={jwt}` on the frontend.
- **Validation:** Every protected endpoint requires `Authorization: Bearer <token>`.

### Files Involved
- **Backend:** `AuthController.java`, `UserService.java`, `JwtAuthenticationFilter.java`, `SecurityConfig.java`.
- **Frontend:** `LoginPage.tsx`, `useAuth.ts`, `authApi.ts`.

### Security Considerations
- JWTs are stateless but vulnerable to XSS if stored in local storage. 
- Passwords are encrypted using BCrypt before storing in DB.
- OAuth secrets (`GOOGLE_CLIENT_SECRET`) are never exposed to the frontend.

---

## 2. Event Application Tracking (CRUD)
### Purpose
The core functionality allowing users to add, edit, delete, and view their applications to hackathons, conferences, or internships.

### User Flow
1. User clicks "Add Application" from the Dashboard.
2. A modal (`AddApplicationModal.tsx`) opens.
3. User fills in event details (Name, URL, Deadline, Status).
4. Submitting closes the modal and instantly updates the UI.

### Internal Flow & APIs
- **Create:** POST `/api/applications`. Inserts into `applications` table.
- **Read:** GET `/api/applications`. Fetches all for the authenticated user ID.
- **Update:** PUT/PATCH `/api/applications/{id}`. Modifies existing record.
- **Delete:** DELETE `/api/applications/{id}`.

### Files Involved
- **Backend:** `ApplicationController.java`, `ApplicationService.java`, `ApplicationRepository.java`, `Application.java`.
- **Frontend:** `applicationsApi.ts`, `DashboardView.tsx`, `AddApplicationModal.tsx`.

### Database Impact
- `applications` table is modified.

---

## 3. Kanban Board Visualization
### Purpose
To visually group applications by their current stage (Interested, Applied, Under Review, Accepted, Rejected) allowing for drag-and-drop or simple status transitions.

### User Flow
1. User navigates to the Kanban View.
2. Applications are grouped into columns based on `status`.
3. User changes the status of an application. The card visually moves to the new column.

### Internal Flow & APIs
- Relies on the same `GET /api/applications` endpoint.
- Frontend logic maps over the array and filters by `status` to render distinct columns.
- State mutation triggers `PUT /api/applications/{id}` to update the status in the backend.

### Files Involved
- **Frontend:** `KanbanView.tsx`.

---

## 4. Calendar Integration
### Purpose
To view application deadlines in a familiar monthly calendar format, ensuring no deadlines are missed.

### User Flow
1. User navigates to Calendar View.
2. The view renders a standard month-grid.
3. Days with deadlines highlight or show a dot.
4. Clicking a day shows the application details.

### Files Involved
- **Frontend:** `CalendarView.tsx`, `calendar.tsx` (UI component).

---

## 5. Analytics Dashboard
### Purpose
To provide users with macro-level insights into their application pipeline, such as acceptance rates and status distributions.

### User Flow
1. User views the Dashboard.
2. Recharts graphs display Application Status Distribution (Pie Chart) and Application Volume over time.

### Internal Flow & APIs
- **Endpoint:** `GET /api/analytics/summary` (or processed on the frontend).
- The frontend uses `Recharts` to parse the data into graphical components.

### Files Involved
- **Backend:** `AnalyticsController.java`, `AnalyticsService.java`.
- **Frontend:** `AnalyticsDashboard.tsx`, `analyticsApi.ts`.

---

## 6. User Profile (Autofill Data)
### Purpose
To store static user metadata (college, skills, LinkedIn, GitHub) so the user doesn't have to repeatedly type this when referencing applications.

### User Flow
1. User navigates to Settings/Profile.
2. Submits the form with portfolio URLs and text.
3. This data can be copied or utilized elsewhere in the app.

### Internal Flow & APIs
- **Endpoint:** GET/PUT `/api/profile`.
- Binds to `UserProfile` entity mapped 1:1 with `User`.

### Files Involved
- **Backend:** `ProfileController.java`, `ProfileService.java`, `UserProfile.java`.
- **Frontend:** `ApplicationProfileForm.tsx`, `userApi.ts`.
