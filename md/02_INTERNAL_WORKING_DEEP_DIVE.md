# 02 INTERNAL WORKING DEEP DIVE

## 1. Startup Flow
### Backend (Spring Boot)
1. **Application Context Initialization:** execution starts at `EventAppTrackerApplication.java` (`main` method). Spring Boot bootstraps the context, scanning for components in `com.eventtracker.*`.
2. **Database Initialization:** Spring Data JPA establishes connection pooling to PostgreSQL. `schema.sql` runs on startup (`spring.sql.init.mode=always`), creating tables `users`, `user_profiles`, and `applications` if they do not exist.
3. **Security Configuration:** `SecurityConfig` beans are loaded. JWT filters, password encoders, and OAuth2 login handlers are injected into the filter chain. CORS configurations are applied dynamically using `allowed-origins`.
4. **Server Start:** Tomcat binds to port 8080 and begins listening for HTTP traffic.

### Frontend (React/Vite)
1. **Vite Server Start:** `npm run dev` starts Vite server. `index.html` loads `src/main.tsx`.
2. **React DOM Rendering:** `main.tsx` mounts the `<App />` component.
3. **Context Providers Initialization:** The tree is wrapped in standard providers: `ThemeProvider` for styles, `QueryClientProvider` for TanStack query caching, and routing contexts.
4. **Authentication Check:** On mounting routes, `useAuth.ts` triggers a background request to fetch user info if a token is present in storage, deciding whether to render protected routes or public routes.

## 2. Authentication Flow
The application supports standard Email/Password authentication as well as OAuth2 via GitHub and Google.

### JWT Authentication Flow
1. **Login Request:** User submits credentials to `/auth/login`.
2. **Controller/Service Layer:** `AuthController` delegates to `AuthenticationManager`. `UserService` validates credentials.
3. **Token Generation:** `JwtTokenProvider` builds a JWT containing the user ID, subject (email), roles, and an expiration timestamp. The secret is fetched from environment variables.
4. **Response:** A JSON response including the JWT is sent to the client.
5. **Client Persistence:** Frontend stores the JWT (typically in localStorage/sessionStorage) and attaches it to the `Authorization: Bearer <token>` header in all subsequent requests via Axios interceptors (`lib/restClient.ts`).

### OAuth2 Flow
1. **Initiation:** User clicks "Login with Google/GitHub", navigating to `/oauth2/authorization/google` or `/oauth2/authorization/github`.
2. **Provider Redirect:** User authorizes the app on the provider's domain.
3. **Callback Handling:** Provider redirects back to the backend callback URI.
4. **Success Handler:** `OAuth2LoginSuccessHandler` intercepts the successful authorization. It extracts the email/profile info, checks if a user exists (if not, creates one), generates a JWT, and redirects the user to the frontend (`OAuthSuccessPage.tsx` or similar) appending the token as a URL parameter.
5. **Client Capture:** The frontend extracts the token from the URL, stores it, and strips the URL for security.

## API Documentation (Swagger)

The backend provides an OpenAPI specification accessible via Swagger UI at:
```
http://localhost:8080/swagger-ui.html
```
The spec is defined in `OpenApiConfig.java` (title: Event Tracker API, version 1.0, JWT bearer security). All Swagger endpoints are permitted in `SecurityConfig.java`.


## 3. Request Lifecycle
A typical authenticated request to fetch applications looks like this:

User Action (Click "Dashboard")
↓
React Router (`wouter`) triggers route load.
↓
TanStack Query (`useQuery`) calls `applicationsApi.ts` (`getApplications`).
↓
Axios Client attaches `Bearer <JWT>`.
↓
Request hits Backend port 8080 (`/api/applications`).
↓
`JwtAuthenticationFilter` intercepts the request, validates the signature, extracts the user details, and populates `SecurityContextHolder`.
↓
`ApplicationController` receives the request. The authenticated user's ID is extracted (often via injected `Principal` or direct service call).
↓
`ApplicationService.findAllByUserId(userId)` is invoked.
↓
`ApplicationRepository.findByUserId(userId)` executes a mapped SQL query against PostgreSQL.
↓
Data is returned, mapped to `ApplicationDTO` to omit sensitive fields.
↓
JSON response is sent back to the client.
↓
TanStack Query caches the response and updates the UI state.
↓
React Re-renders the Dashboard View.

## 4. State Flow
### Server State
The frontend relies heavily on **TanStack Query** for server state. It eliminates the need for Redux or complex Context APIs for data storage. Queries automatically invalidate and refetch on mutation (e.g., adding an application invalidates the "applications" cache key).
### Local UI State
Local state (like modal open/close, form inputs) is handled using `useState` and `react-hook-form`. Forms are validated synchronously using `zod` schema resolvers.
### Global Theme State
`ThemeContext` provides light/dark mode preference, persisting to localStorage and applying CSS variables to the document root.

## 5. Error Handling & Recovery
**Backend:**
Global error handling is typically managed via `@ControllerAdvice` and `@ExceptionHandler`. Custom exceptions (`DuplicateEventException`) are thrown in the service layer, caught globally, and converted to standardized JSON error responses (e.g., `{"message": "Event already exists", "status": 409}`).

**Frontend:**
- **Network Errors:** Axios interceptors capture global errors (e.g., 401 Unauthorized invalidates the session and redirects to login).
- **UI Errors:** Wrapped in `ErrorBoundary.tsx` to prevent the app from crashing entirely, showing a fallback UI.
- **Form Errors:** Caught by `react-hook-form` and displayed inline below inputs.
- **Toast Notifications:** Handled by `sonner` via `lib/utils.ts` and `lib/errors.ts` to surface user-friendly error messages.

## 6. Database Flow
The app uses a direct entity-to-table mapping. 
- The `User` entity has a `@OneToOne` mapping with `UserProfile` and `@OneToMany` with `Application`. `ON DELETE CASCADE` is set at the database schema level (`schema.sql`).
- The `UserProfile` stores loosely structured metadata (JSON-like text fields for skills).
- Indexes on `email` (Users) and `user_id`, `status` (Applications) optimize read query speeds. A unique constraint ensures idempotency for application additions (preventing duplicate saves of the same URL).
