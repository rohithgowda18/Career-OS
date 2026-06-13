# 04 DEVELOPER KNOWLEDGE BASE

This guide is intended for new engineers joining the team. It accelerates onboarding by highlighting core architectural decisions, hidden complexities, and providing practical steps for extending and debugging the application.

## 1. Important Classes & Services

### Backend Core
- **`JwtTokenProvider.java`**: The absolute core of security. Handles parsing and building JWTs. Understand its `generateToken()` and `validateToken()` methods before modifying anything related to sessions.
- **`SecurityConfig.java`**: Defines the filter chain. This is where endpoints are made public (e.g., `/auth/**`) or protected. If an endpoint is returning a 401 unexpectedly, look here first.
- **`ApplicationService.java`**: The heart of the business logic. All CRUD operations on the main domain entity go through here. It abstracts the `ApplicationRepository`.
- **`OAuth2LoginSuccessHandler.java`**: Critical for bridging Spring Security's OAuth2 implementation with the stateless JWT architecture. It acts as the bridge that writes a custom JWT after Google/GitHub authenticates a user.

## API Documentation (Swagger)

The backend provides an OpenAPI specification via **Swagger UI**. The configuration lives in `OpenApiConfig.java` and defines:

- **Title:** Event Tracker API
- **Version:** 1.0
- **Description:** Backend APIs for Event Tracker application that helps users manage and track events.
- **Security:** JWT Bearer (`bearerAuth`).

Access the UI at:

```
http://localhost:8080/swagger-ui.html
```

All Swagger endpoints are whitelisted in `SecurityConfig.java` for unauthenticated access.


### Frontend Core
- **`useAuth.ts`**: The main React hook determining if a user is logged in. It abstracts away the token checks and user fetching.
- **`restClient.ts`**: The Axios instance. **Crucial:** It contains the interceptor that attaches the `Authorization` header to every outgoing request.
- **`applicationsApi.ts`**: The boundary layer. All frontend components should call methods in this file rather than using `fetch` or `axios` directly to ensure types match the backend DTOs.

## 2. Hidden Couplings
- **Database Cascades vs. Application Deletion:** The schema uses `ON DELETE CASCADE` from `users` to `applications` and `user_profiles`. Deleting a user in the backend *will* silently nuke all their applications. Ensure this is explicitly stated in UI warnings.
- **Frontend Token Storage:** The backend assumes the frontend will properly store the token and send it back. If `OAuth2LoginSuccessHandler` changes the redirect URL structure (e.g., from `?token=` to a hash fragment `#token=`), the `OAuthSuccessPage.tsx` component will silently break.

## 3. Architecture Decisions
- **Why JWT over Session Cookies?** Because the backend and frontend are hosted independently (and often on different subdomains), JWTs avoid complex cross-origin cookie sharing configurations and allow the backend to remain entirely stateless.
- **Why React Query (TanStack)?** Standard Redux requires immense boilerplate. Since 90% of the app's state is "server state" (applications, profile data), TanStack Query handles caching, invalidation, and loading states automatically, significantly reducing frontend complexity.
- **Modular Monolith over Microservices:** Given the domain size, splitting this into microservices would introduce distributed tracing nightmares and network latency without any realistic scaling benefits.

## 4. Technical Debt & Scaling Opportunities
### Technical Debt
- **Pagination:** `GET /api/applications` currently returns *all* applications for a user. If a power user tracks 10,000 events, the payload size will drag down the frontend. Pagination or infinite scrolling must be implemented.
- **Rate Limiting:** There is currently no API rate limiting, leaving the login and registration endpoints vulnerable to brute force and credential stuffing.

### Scaling Opportunities
- **Caching:** The backend database hits can be reduced by caching frequent queries (like User Profiles) using Redis or Spring Cache.
- **Indexing:** While indexes exist, analyzing execution plans on `idx_applications_user_id` as the table grows to millions of rows will be necessary.

## 5. How To Add New Features
### Example: Adding a "Company Name" to Applications
1. **Backend DB:** Create a Flyway migration (or update `schema.sql`) to add `company_name VARCHAR(255)` to `applications`.
2. **Backend Entity:** Add `private String companyName;` to `Application.java`.
3. **Backend DTO:** Add `companyName` to `ApplicationDTO.java`.
4. **Frontend Type:** Update `db-types.ts` so `Application` interface includes `company_name?: string`.
5. **Frontend UI:** Add a new `<Input />` in `AddApplicationModal.tsx` and map it using `react-hook-form`.

## 6. How To Debug Issues
- **CORS Errors:** This is almost always due to `SecurityConfig.java` in the backend not whitelisting the frontend's origin URL (especially common when deploying to production domains like Vercel). Check the `ALLOWED_ORIGINS` env var.
- **401 Unauthorized on Valid JWT:** Ensure the JWT hasn't expired (default is often 30 mins to 1 hour). Check the server time vs. the client time; token expiration uses UTC timestamps.
- **Data Not Refreshing:** In the frontend, if you update an application and it doesn't show, ensure you are calling `queryClient.invalidateQueries({ queryKey: ['applications'] })`.

## 7. Interview Explanation Guide (For Portfolio Use)
If asked about this project in an interview:
- **"What was the hardest part?"** Discuss the OAuth2 to JWT bridge. Explain how standard OAuth assumes session-backed servers, and how you had to write a custom success handler to intercept the OAuth token, build a custom JWT, and pass it securely to a SPA frontend.
- **"Why didn't you use [Technology X]?"** Emphasize *maintainability and over-engineering avoidance*. State that React Query was chosen over Redux because state is primarily server-driven. PostgreSQL was chosen over NoSQL because the data is highly relational (Users -> Applications).
