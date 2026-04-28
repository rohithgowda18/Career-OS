# Event App Tracker — System Architecture & Technical Specifications

## 1. Executive Summary
The **Event App Tracker** is a full-stack platform designed to manage event applications, track success rates, and provide AI-driven recommendations. The system is architected as a decoupled micro-architecture with a Spring Boot backend and a React/Vite frontend, optimized specifically for low-latency performance in resource-constrained cloud environments.

---

## 2. Backend Architecture (Spring Boot 3.2.x / Java 17)
The backend follows a standard N-tier architecture (Controller-Service-Repository) with strong emphasis on lazy-loading and startup optimization.

### 🔐 Security & Identity
- **JWT-based Stateless Auth**: Custom security filter chain using `jjwt` for token generation and validation.
- **OAuth2 Integration**: Support for Google and GitHub social logins, mapped to a unified internal User entity.
- **Lazy Security Graph**: Architected to decouple security filters from service beans at startup to ensure sub-30s boot times.

### 📦 Core Domain Entities
- **Application**: The central unit tracking event name, type, status (Interested, Applied, etc.), and deadlines.
- **User/Profile**: Multi-tenant design with support for public profiles and private preferences.
- **Team**: Collaborative features allowing users to group under shared workspaces.
- **Analytics/Scoring**: Derived data entities for success rates and event relevance.

### 🛠️ Key Technologies
- **Spring Data JPA / Hibernate**: Persistence layer using PostgreSQL with optimized query strategies (JOIN FETCH) to eliminate N+1 problems.
- **LangChain4j**: Integration with LLMs (Groq/Llama 3.1) for automated event metadata extraction and recommendation logic.
- **Jsoup**: High-performance HTML parsing for web scraping event details from URLs.
- **HikariCP**: Connection pooling tuned for high-concurrency with minimal idle overhead.

---

## 3. Frontend Architecture (Vite / React / TypeScript)
The frontend is a modern SPA (Single Page Application) optimized for bundle size and fast interaction.

### 🎨 UI & UX Design
- **Modern Stack**: Built with React 18, Tailwind CSS, and Shadcn/UI for a premium, accessible interface.
- **Routing**: Uses `wouter` for lightweight, hook-based routing.
- **Responsive Layouts**: Dedicated views for Dashboard (Kanban), List, and Calendar.

### 🔌 API Integration
- **Axios restClient**: Centralized client with request/response interceptors for JWT injection and unified error handling.
- **Keep-Alive**: Custom hook to prevent backend "cold starts" by maintaining a heartbeat with the server during active sessions.

---

## 4. Performance & Scalability Design
As a senior engineering decision, the system was tuned for **Render's Free Tier (512MB RAM)**:

1.  **Lazy Initialization**: 90% of beans are initialized on-demand rather than at boot.
2.  **JIT Optimization**: JVM `-XX:TieredStopAtLevel=1` used to reduce JIT compilation overhead at startup.
3.  **GC Selection**: `UseSerialGC` selected over G1GC/ZGC to minimize CPU context switching on single-core instances.
4.  **Hibernate boot-time exclusion**: JDBC metadata access disabled to avoid database round-trips during the startup sequence.

---

## 5. Third-Party Integrations
- **Groq AI**: Used for real-time processing of event descriptions to categorize and score applications.
- **SMTP (Mail)**: Decoupled via `ObjectProvider` to ensure the mail subsystem doesn't block application boot.
- **Vercel/Render**: Automated CI/CD pipeline ensuring frontend and backend are always in sync with the `main` branch.

---

## 6. Engineering Principles Followed
- **Modularity**: Services are decoupled to allow for future migration to microservices if load increases.
- **Fail-Fast**: Timeouts and validation layers ensure the system fails predictably rather than hanging.
- **Type Safety**: End-to-end TypeScript on the frontend and strong Java typing on the backend minimize runtime regressions.
