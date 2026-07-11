# Opportunity Management Platform (OMP)

A modern, high-performance, full-stack monorepo application designed to track and manage event applications and career placements.

---

## 🛠️ Technology Stack

-   **Frontend**: React (Vite), TailwindCSS, TypeScript, TanStack Query, Wouter, Lucide.
-   **Backend**: Spring Boot 3.2, Spring Security, Spring Data JPA, Gemini AI client.
-   **Database**: H2 (In-Memory Development) / PostgreSQL (Production).
-   **Deployment**: Vercel (Frontend) and Render (Backend + Database).

---

## 📂 Project Structure

\\n├── apps/
│   ├── backend/        # Spring Boot Java REST API
│   └── web/            # Vite + React Client Dashboard
├── docs/
│   ├── FRONTEND_OVERVIEW.md    # Frontend architecture, components, and PWA setup
│   ├── BACKEND_OVERVIEW.md     # Backend architecture and core services
│   └── SECURITY_DATABASE.md    # Authentication strategy, PWA session recovery, & schemas
└── docker-compose.yml  # Local multi-container development configuration
\\n
---

## ⚡ Quick Start

### Prerequisites
-   **Java 17 or 21**
-   **Node.js 18+**
-   **Maven**

### Running the Backend
1. Navigate to the backend directory:
   cd apps/backend\n2. Start the Spring Boot application:
   mvn spring-boot:run\n   *The server runs on http://localhost:8080.*

### Running the Frontend
1. Navigate to the web directory:
   cd apps/web\n2. Install dependencies:
   pm install\n3. Start the development server:
   pm run dev\n   *The client runs on http://localhost:5173.*

---

## 📖 Core Documentation

For deeper architectural details, refer to:
1.  **[Frontend Architecture & PWA](file:///c:/Users/rohit/Desktop/Event-Tracker/docs/FRONTEND_OVERVIEW.md)**: Router layout, cache management, manual PWA update prompts, and token persistence.
2.  **[Backend Services & APIs](file:///c:/Users/rohit/Desktop/Event-Tracker/docs/BACKEND_OVERVIEW.md)**: N-tier architecture, Gemini AI extraction services, and endpoint routes.
3.  **[Security & Database Design](file:///c:/Users/rohit/Desktop/Event-Tracker/docs/SECURITY_DATABASE.md)**: JWT stateless session configurations, 3-tier browser storage fallback, CORS policies, and schema structures.
