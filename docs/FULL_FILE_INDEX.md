# Full File Index - 100% Comprehensive

This document is the definitive index of all source files in the Event Application Tracker repository.

## Backend (Spring Boot 3.2)

### 🚀 Core
- `EventAppTrackerApplication.java`: Main Spring Boot entry point and component scanning.
- `config/PasswordEncoderConfig.java`: Definition of the `BCryptPasswordEncoder` bean.
- `resources/schema.sql`: Production-stable database schema definition.

### 🛡️ Security
- `security/SecurityConfig.java`: Central security filter chain, CORS, and route protection rules.
- `security/JwtAuthenticationFilter.java`: JWT extraction and validation filter.
- `security/JwtTokenProvider.java`: Token generation and parsing utility.
- `security/oauth/OAuth2LoginSuccessHandler.java`: Post-OAuth2 login logic and frontend redirection.

### 📡 Controllers
- `controller/ApplicationController.java`: CRUD endpoints for `/applications`.
- `controller/AuthController.java`: JWT login and registration endpoints.
- `controller/AnalyticsController.java`: Statistical endpoints for charts and metrics.
- `controller/ProfileController.java`: Endpoints for managing user profile details.

### 🛠️ Services (Business Logic)
- `service/ApplicationService.java`: Logic for application management and URL normalization.
- `service/UserService.java`: User account management and profile initialization.
- `service/ProfileService.java`: Logic for updating extended user profile data.
- `service/AnalyticsService.java`: Complex aggregation logic for status and acceptance rates.

### 📦 Persistence (Entities & Repos)
- `entity/User.java`: User account model with Security UserDetails implementation.
- `entity/Application.java`: Application tracking model with unique URL constraints.
- `entity/UserProfile.java`: Extended user data model.
- `repository/UserRepository.java`: User data access with case-insensitive search.
- `repository/ApplicationRepository.java`: Application data access with complex filtering.
- `repository/UserProfileRepository.java`: Profile data access.

### 📝 DTOs (Data Transfer)
- `dto/ApplicationDTO.java`: Validated transfer object for application data.
- `dto/AuthDTO.java`: Static inner classes for Login, Register, and AuthResponse.
- `dto/UserDTO.java`: Transfer object for user information.
- `dto/UpdateProfileRequestDTO.java`: Specialized DTO for profile updates.

### ⚠️ Exceptions
- `exception/DuplicateEventException.java`: Thrown on URL collision.
- `exception/DuplicateUserException.java`: Thrown on email collision.

## Frontend (React 19 + Vite)

### 🖼️ Pages
- `pages/LandingPage.tsx`: Hero section, features, and public entry.
- `pages/LoginPage.tsx`: Authentication hub.
- `pages/Home.tsx`: Main authenticated dashboard layout.
- `pages/AddEventPage.tsx`: Dedicated form for new applications.
- `pages/OAuthSuccessPage.tsx`: Post-OAuth token persistence logic.
- `pages/NotFound.tsx`: Graceful 404 handler.

### 🧱 Views & Components
- `components/views/DashboardView.tsx`: Analytics cards and deadline lists.
- `components/views/KanbanView.tsx`: Draggable-style status columns.
- `components/views/CalendarView.tsx`: Deadline visualization.
- `components/ApplicationProfileForm.tsx`: Settings and profile editor.
- `components/ErrorBoundary.tsx`: Application-wide crash protection.
- `components/ui/*`: 20+ Radix UI based accessible primitives.

### 🧠 Logic & API
- `lib/restClient.ts`: Axios client with global interceptors.
- `lib/api/applicationsApi.ts`: Application CRUD calls.
- `lib/api/authApi.ts`: Authentication calls.
- `lib/api/analyticsApi.ts`: Data aggregation calls.
- `lib/api/userApi.ts`: Profile management calls.
- `hooks/useAuth.ts`: Central authentication state hook.
- `contexts/ThemeContext.tsx`: Persistent theme management.

### 🏷️ Types
- `types/db-types.ts`: Exhaustive TypeScript interfaces matching backend entities.
- `types/types.ts`: Root type exports.
