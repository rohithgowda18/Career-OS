# Event Application Tracker

A minimal, high-performance full-stack application for tracking event applications (hackathons, conferences, internships). Designed as a professional portfolio piece focusing on clean architecture and robust CRUD functionality.

## 🚀 Key Features

*   **Authentication**: Secure JWT-based login and registration.
*   **Application Tracking**: Full CRUD for tracking event applications with a clean UI.
*   **Kanban Board**: Visualize your application lifecycle (Interested → Applied → Under Review → Accepted).
*   **Calendar Integration**: View deadlines in a monthly calendar and export to `.ics` format.
*   **Analytics**: Visualize status distribution and acceptance rates using interactive charts.
*   **Application Profile**: Store your personal details (college, skills, links) for quick autofill.

## 🛠️ Tech Stack

### **Backend**
*   **Java 17** with **Spring Boot 3.2**
*   **Spring Security** + **JWT**
*   **Spring Data JPA** with **PostgreSQL**
*   **Flyway** for database migrations

### **Frontend**
*   **React 19** with **TypeScript**
*   **Vite** for fast development
*   **TanStack Query** (React Query) for state management
*   **Tailwind CSS** + **Lucide Icons**
*   **Recharts** for analytics

## 📂 Project Structure

*   `apps/backend` — Spring Boot REST API
*   `apps/web` — React frontend application
*   `docs/` — Architecture and API documentation

## 🏁 Getting Started

### **Backend**
1.  Navigate to `apps/backend`.
2.  Configure your database in `src/main/resources/application.yml`.
3.  Run the application: `./mvnw spring-boot:run`

### **Frontend**
1.  Navigate to `apps/web`.
2.  Install dependencies: `npm install`
3.  Run the dev server: `npm run dev`

---
*Built with focus on maintainability and simplicity.*
