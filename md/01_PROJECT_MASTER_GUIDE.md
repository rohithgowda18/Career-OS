# 01 PROJECT MASTER GUIDE

## Executive Summary
The **Event Application Tracker** is a full-stack, modular web application designed for users to seamlessly track, manage, and visualize their applications for events such as hackathons, conferences, and internships. It serves as a unified system bridging an intuitive React frontend with a robust, high-performance Spring Boot API. Designed with a clear separation of concerns, the application utilizes a relational database (PostgreSQL) and adheres to modern architectural principles including RESTful API design, JWT-based authentication, and a scalable folder structure.

## Project Purpose
**Business Problem Solved:** Event participants and job seekers often struggle to track multiple deadlines, application statuses, and related metadata (URLs, notes) across various platforms. The application solves this by providing a centralized dashboard, kanban board, and calendar view.
**Target Users:** Students, developers, job seekers, and event attendees.
**Main Workflows:**
1. Secure User Registration & Authentication (Standard JWT & OAuth2).
2. Application Tracking (CRUD operations on events).
3. Status Visualization (Kanban board for application lifecycle: Interested → Applied → Under Review → Accepted).
4. Profile Management (Autofill data such as college, skills, links).
5. Analytics & Export (Visualizing status distribution and exporting deadlines to calendar formats).

## Technology Stack

### Frontend
- **Framework:** React 19 (using Vite for lightning-fast HMR and building)
- **Language:** TypeScript
- **State Management:** TanStack Query (React Query) for server-state synchronization and caching.
- **Routing:** `wouter` (A minimalist routing solution for React)
- **Styling:** Tailwind CSS (utility-first CSS framework), combined with Radix UI for accessible headless components and Framer Motion for micro-animations.
- **Other:** Recharts (Analytics), `react-hook-form` + `zod` (Validation).

### Backend
- **Framework:** Java 17 with Spring Boot 3.2.
- **Security:** Spring Security with stateless JWT tokens and OAuth2 client integration (Google, GitHub).
- **API Architecture:** RESTful API following MVC patterns.

### Database
- **Type:** Relational (PostgreSQL via JDBC).
- **ORM:** Spring Data JPA (Hibernate under the hood).
- **Schema Management:** Raw SQL initialization (`schema.sql`), with Flyway listed in requirements (though standard schema initialization is heavily utilized).

### Infrastructure & External Integrations
- **CI/CD & Deployment:** Vite PWA integration for progressive web app capabilities.
- **Authentication Providers:** Custom JWT, Google OAuth, GitHub OAuth.
- **Analytics Tools:** Recharts on the frontend.

## System Architecture
The application follows a **Modular Monolith** pattern on the backend and a **Single Page Application (SPA)** pattern on the frontend. It is structurally split into two primary applications (`apps/web` and `apps/backend`).
The backend acts as a stateless REST server. It handles authentication and authorization at the security layer, validates input at the controller layer, executes business logic at the service layer, and interfaces with the database via the repository layer. The frontend is a thick client that consumes these APIs, caching responses with TanStack Query.

## Folder Structure

### Backend (`apps/backend/src/main/java/com/eventtracker`)
- `config/`: Contains application-wide configurations (e.g., `PasswordEncoderConfig`).
- `controller/`: REST API endpoints (`AuthController`, `ApplicationController`, etc.). Responsible for HTTP request/response handling.
- `dto/`: Data Transfer Objects for decoupling API contracts from internal entity structures.
- `entity/`: JPA Entities mapping to database tables (`User`, `Application`, `UserProfile`).
- `exception/`: Custom domain exceptions (e.g., `DuplicateEventException`).
- `repository/`: Spring Data JPA interfaces for database access.
- `security/`: JWT token providers, filters, and `SecurityConfig`.
- `service/`: Core business logic separating controllers from data access.

### Frontend (`apps/web/src`)
- `api/`: API client configurations and API functions (Axios wrappers).
- `components/`: Reusable React components (UI components like buttons, modals, and layout wrappers).
- `contexts/`: React Contexts (e.g., `ThemeContext` for dark/light mode).
- `hooks/`: Custom React hooks (`useAuth`).
- `lib/`: Utility functions and shared helpers.
- `pages/`: Top-level page components mapping to routes.
- `views/`: Distinct composite views (e.g., `CalendarView`, `KanbanView`).

## Design Patterns utilized
1. **MVC (Model-View-Controller)**: The Spring Boot backend maps directly to this, separating data (Entity), presentation (DTOs/JSON responses), and logic (Controllers/Services).
2. **Repository Pattern**: Used extensively via Spring Data JPA to abstract database interactions.
3. **Service Pattern**: Business logic is encapsulated in `@Service` classes, keeping controllers thin.
4. **Dependency Injection**: Core to Spring Boot (constructor injection via `Lombok @RequiredArgsConstructor`) and React Contexts.
5. **Adapter Pattern**: The API client on the frontend adapts the raw fetch/axios responses into strong TypeScript types.

## API Documentation (Swagger)

The backend exposes OpenAPI documentation via **Swagger UI**. The OpenAPI spec is configured in `OpenApiConfig.java` with the following metadata:

- **Title:** Event Tracker API
- **Version:** 1.0
- **Description:** Backend APIs for Event Tracker application that helps users manage and track events.
- **Security:** JWT Bearer authentication (`bearerAuth`).

You can access the UI at:

```
http://localhost:8080/swagger-ui.html
```

The Swagger UI lists all endpoints and allows testing with a JWT token. All Swagger endpoints are whitelisted in `SecurityConfig.java`.


For production, you may want to restrict access or secure it behind authentication.

## Deployment & Environment Variables
- **Backend Env:** `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`. Configured via `application.yml` with fallbacks.
- **Frontend Env:** Handled via Vite environment variables. PWA capabilities are baked in via `vite-plugin-pwa`.

*(Code references: `README.md`, `application.yml`, `vite.config.ts`, `SecurityConfig.java`)*
