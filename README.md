# Career OS

**Career OS** is a high-performance, full-stack monorepo application engineered to serve as a personal workspace for tracking event applications, job placement pipelines, professional skills portfolios, and AI-assisted content parsing. 

Built with scalability, security, and exceptional user experience in mind, this project showcases modern software engineering practices across a decoupled React frontend and a Spring Boot microservice backend.

---

## 🚀 Key Engineering Showcases

### 🤖 Generative AI Data Extraction
-   Integrated the Google Gemini `gemini-2.5-flash` model to process unstructured texts (such as email offers or job boards) and extract clean relational models.
-   Configured structured JSON schema validation directly in the AI pipeline to guarantee formatted outputs mapped directly to PostgreSQL placement repositories.

### 🔐 Resilient PWA Authentication & Popups
-   **Stateless Security**: Custom JWT filter pipelines utilizing HMAC SHA-512 signatures with a 15-day session duration, fully isolated from CSRF vulnerabilities.
-   **OAuth postMessage Protocol**: Popups handle Google/GitHub authentication and securely transmit tokens back to parent windows using standard HTML5 cross-document messaging, closing automatically on completion.
-   **Cold Start Latency Recovery**: Integrated custom retry wrappers that monitor CORS network timeout events (commonly caused by sleeping backend instances), poll health checks, and execute requests automatically once online.

### 🎨 Modular UI & Multi-Theme Engine
-   **Skills Portfolio Engine**: Formats skills into visual learning domains with color-coded status badges, grouping batch updates and deletions inside single transactional saves.
-   **Dynamic Styling**: A robust custom theme context supporting five distinct design paradigms (Glassmorphic, Cyberpunk, Neo-Brutalist, Retro Monospace, Claymorphic) configured entirely through dynamic CSS custom property tokens.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, TanStack Query (React Query v5), Wouter |
| **Backend** | Java 17/21, Spring Boot 3.2, Spring Security, Spring Data JPA, PostgreSQL, Gemini SDK |
| **PWA Features** | Workbox Offline Caching, Static Web Manifests, Update Available Toasts |
| **Deployment** | Vercel (Client App), Render (Server & DB Instances) |

---

## ⚡ Quick Start

### Running the Backend
1.  Navigate to `/apps/backend` and run:
    ```bash
    mvn spring-boot:run
    ```
    *The API server will listen on `http://localhost:8080`.*

### Running the Frontend
1.  Navigate to `/apps/web` and run:
    ```bash
    npm install
    npm run dev
    ```
    *The client hot-reloading dev server will start on `http://localhost:5173`.*

---

## 📖 System Blueprints

Detailed architectural guides and specifications can be reviewed under the `/docs` directory:
1.  **[Frontend & PWA Architecture Guide](file:///c:/Users/rohit/Desktop/Event-Tracker/docs/FRONTEND_OVERVIEW.md)**: Details layout structures, theme tokens, and popup callback events.
2.  **[Backend APIs & Services Blueprint](file:///c:/Users/rohit/Desktop/Event-Tracker/docs/BACKEND_OVERVIEW.md)**: Outlines Spring Boot configurations, N-Tier layering, and REST endpoint tables.
3.  **[Security Protocol & Schemas Blueprint](file:///c:/Users/rohit/Desktop/Event-Tracker/docs/SECURITY_DATABASE.md)**: Breaks down stateless token filters, CORS configs, and PostgreSQL tables.
