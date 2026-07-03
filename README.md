# ?? Career OS: Event & Placement Tracker

> A high-performance, modern, full-stack application designed to track and manage event applications (hackathons, conferences, workshops, internships) and career placements. Built as a professional monorepo showcase focusing on clean N-tier backend architecture, secure authentication, AI-driven automation, and premium UI analytics.

![Java](https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## ?? Architecture Overview

```mermaid
graph TD
    Vercel[Vercel Frontend] -->|REST API Requests / JWT| Render[Render Backend]
    Render -->|Database Operations| Neon[Neon Serverless Postgres]
    Render -->|Information Extraction| Gemini[Gemini 2.5 Flash API]
```

The codebase is organized as a structured monorepo:
*   [apps/web](file:///apps/web) — React 19 single-page frontend.
*   [apps/backend](file:///apps/backend) — Spring Boot 3.2 REST API.
*   [docs](file:///docs) — Deep-dive engineering specifications.

---

## ? Verified Features

Every feature listed here is verified to be fully or partially implemented in the source code.

### 1. ?? Security & Identity Control
*   **Stateless Authentication**: Session management using JSON Web Token (JWT) signatures (HS512).
*   **OAuth2 Integration**: Login handlers for Google and GitHub social authentication.
*   **Password Hashing**: BCrypt hashing for credentials.
*   **Global CORS**: Pre-configured cross-origin request policies.

### 2. ?? Event Application Suite
*   **Full CRUD Log**: Add, read, update, and delete events (Hackathons, Workshops, Conferences, Internships, and others) with statuses (*Interested, Applied, Under Review, Accepted, Rejected*).
*   **Kanban Board**: Drag-and-drop status stages mapping event pipelines.
*   **Interactive Calendar**: Deadline calendar view with deadline proximity calculations.

### 3. ?? Career Placements Tracking
*   **Job Funnel Pipeline**: Track placements across detailed statuses (*Applied, Assessment Scheduled, Assessment Completed, Interview Scheduled, Interview Completed, Offer Received, Rejected*).
*   **Placement Kanban Board**: Kanban board mapping placement pipelines.
*   **Data Integrity**: Multi-column constraints preventing duplicate user/company/role/link entries.

### 4. ?? Gemini AI Information Extraction
*   **AI Auto-Extraction**: Backend uses the `gemini-2.5-flash` model to parse recruiter emails, returning company name, role, stipend, CTC, application links, assessment dates, and interview dates.
*   **Robust Retry & URL preservation**: Implements a 3-attempt backoff retry and extracts/preserves original URLs from the parsed email content.

### 5. ?? Pipeline Insights & Analytics
*   **Events Yield**: Acceptance rates by event type.
*   **Placements Funnel**: Conversion metrics (Applied -> Assessment -> Interview -> Offer).
*   **Dashboard View**: High-level aggregate dashboard displaying total applications, upcoming deadlines within 7 days, status distributions, and recent activity.

### 6. ?? Profiles & Custom Preferences
*   **Academic/Social Vault**: Save college, skills, location, GitHub, LinkedIn, and portfolio URLs.
*   **Preference Flags**: UI options and database schema fields for email alerts and weekly digests (note: backend notifier service is a skeleton only).

---

## ??? Technology Stack

| Layer | Technology | Primary Rationale |
|---|---|---|
| **Backend** | **Java 17 / Spring Boot 3.2** | Enterprise-grade stability, N-Tier separation (Controller-Service-Repository). |
| **Security** | **Spring Security + JJWT** | Stateless token authorization using secure HS512 cryptographic keys. |
| **Database** | **PostgreSQL (Neon)** | ACID compliance, unique multi-column indexing, schema-level validation. |
| **AI Integration**| **Gemini 2.5 Flash** | Dynamic JSON generation config, schema reflection, token-efficient extraction. |
| **Frontend** | **React 19 / TypeScript** | Static type safety matching backend interfaces, declarative component lifecycle. |
| **State** | **TanStack Query (React Query)**| Declarative server-state caching, automatic refetching, and query invalidation. |
| **Styling** | **Tailwind CSS 4** | Utility-first styling with native CSS nesting and `@tailwindcss/vite` plugin. |
| **Routing** | **Wouter** | Minimalist, ultra-lightweight client routing engine (~1KB). |
| **Charts** | **Recharts** | Declarative, SVG-based responsive visualization library. |

---

## ?? Getting Started

### Prerequisites
*   Java 17+
*   Maven 3.8+
*   Node.js 18+
*   PostgreSQL 13+

### 1. Database Setup
Create your local database:
```sql
CREATE DATABASE event_tracker_db;
```
The application will initialize schema structures automatically on startup via `schema.sql` (`spring.sql.init.mode=always`).

### 2. Environment Variables Configuration
Create a `.env` file in the project root:
```ini
DATABASE_URL=postgresql://postgres:password@localhost:5432/event_tracker_db
DB_URL=jdbc:postgresql://localhost:5432/event_tracker_db
DB_USERNAME=postgres
DB_PASSWORD=password
JWT_SECRET=your-minimum-64-character-jwt-signing-secret-key-goes-here
GEMINI_API_KEY=your-google-ai-studio-api-key
GEMINI_API_MODEL=gemini-2.5-flash
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:5173
VITE_API_URL=http://localhost:8080
```

### 3. Running Locally

#### **Run Backend**
```bash
cd apps/backend
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```
*Backend runs on `http://localhost:8080` (endpoints under `/api`).*

#### **Run Frontend**
```bash
cd apps/web
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## ?? API Reference

All endpoints (except login/register) require a `Bearer <JWT>` Authorization header.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate and receive JWT | Public |
| `GET` | `/api/auth/me` | Get current authenticated user | JWT |
| `GET` | `/api/applications` | List event applications | JWT |
| `POST` | `/api/applications` | Create an application | JWT |
| `PUT` | `/api/applications/{id}` | Update an application | JWT |
| `DELETE` | `/api/applications/{id}` | Delete an application | JWT |
| `GET` | `/api/placements` | List placements | JWT |
| `POST` | `/api/placements` | Create a placement | JWT |
| `PUT` | `/api/placements/{id}` | Update a placement | JWT |
| `DELETE` | `/api/placements/{id}` | Delete a placement | JWT |
| `POST` | `/api/placements/extract` | AI-extract placement from email text | JWT |
| `GET` | `/api/analytics/applications/summary` | Event applications metrics summary | JWT |
| `GET` | `/api/analytics/applications/status-distribution` | Status distribution maps | JWT |
| `GET` | `/api/analytics/applications/conversion-rates` | Acceptance yield calculations | JWT |
| `GET` | `/api/analytics/placements/summary` | Placements metrics summary | JWT |
| `GET` | `/api/analytics/placements/status-distribution` | Placements status distribution | JWT |
| `GET` | `/api/analytics/placements/conversion-rates` | Placement stage conversion yields | JWT |
| `GET` | `/api/analytics/placements/trends` | Monthly placement trends over time | JWT |
| `GET` | `/api/analytics/dashboard` | Aggregated dashboard datasets | JWT |
| `GET` | `/api/profile` | Get user profile preferences | JWT |
| `PUT` | `/api/profile` | Update profile preferences | JWT |

---

## ?? Cloud Deployment

### 1. Database (Neon Postgres)
- Deploy database on [Neon](https://neon.tech).
- Add database credentials to env.

### 2. Backend (Render)
- Deploy as **Web Service** using Docker runtime.
- **Root Directory**: `apps/backend`
- Render reads the configuration in `Dockerfile` directly.

### 3. Frontend (Vercel)
- Deploy `apps/web` on [Vercel](https://vercel.com).
- Configure environment variable `VITE_API_URL` pointing to the Render backend URL (no trailing slash, no `/api` suffix).

---

## ?? Project Structure

```
Career-OS/
+-- apps/
¦   +-- backend/                    # Spring Boot 3.2 REST API
¦   ¦   +-- src/main/java/com/eventtracker/
¦   ¦   ¦   +-- controller/         # REST endpoint handlers
¦   ¦   ¦   +-- service/            # Business logic layer
¦   ¦   ¦   +-- entity/             # JPA entities
¦   ¦   ¦   +-- repository/         # Spring Data repositories
¦   ¦   ¦   +-- dto/                # Data Transfer Objects
¦   ¦   ¦   +-- security/           # JWT + Spring Security config
¦   ¦   ¦   +-- exception/          # Custom exception classes
¦   ¦   +-- src/main/resources/
¦   ¦   ¦   +-- schema.sql          # Database schema (auto-applied)
¦   ¦   ¦   +-- application.yml     # Base configuration
¦   +-- web/                        # React 19 + TypeScript SPA
¦       +-- src/
¦       ¦   +-- pages/              # Route-level page components
¦       ¦   +-- components/         # Reusable UI components
¦       ¦   +-- lib/api/            # Axios API call modules
¦       ¦   +-- hooks/              # Custom React hooks
¦       +-- vercel.json             # SPA rewrite rules
```

---

## ?? Known Limitations

1. **Email Alerts Notification Engine**: Preferences are persisted, and the `EmailService` class is present, but no scheduler or trigger engine is currently implemented to send emails in production.
2. **Brute-Force Vulnerability**: Authentication endpoints currently lack rate-limiting.
3. **Database Versioning**: The project relies on `schema.sql` checks instead of a versioned schema migration engine (e.g. Flyway).
