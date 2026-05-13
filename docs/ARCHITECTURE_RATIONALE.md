# Architectural Rationale: Engineering Decisions & Trade-offs

This document provides a senior-level analysis of the engineering decisions made for the Event Application Tracker, explaining the **Approaches**, **Tools**, and the **Rationale** behind each choice.

---

## 🏗️ 1. Backend Architecture: The N-Tier Pattern

### **Approach**: N-Tier (Layered) Architecture
We follow a strict **Controller -> Service -> Repository** layer separation.
-   **Why**: This pattern is chosen for its **maintainability** and **testability**. By decoupling the HTTP handling (Controller) from the business logic (Service), we can unit test our business rules without spinning up a web server.
-   **Alternative Considered**: Hexagonal Architecture.
-   **Decision**: Hexagonal was deemed overkill for a CRUD-heavy application. N-Tier provides the right balance of structure without the excessive boilerplate of "ports and adapters."

### **Database Strategy**: Relational (PostgreSQL) + JPA
-   **Approach**: Relational modeling with strong ACID compliance.
-   **Rationale**: Event tracking requires complex relationships (User <-> Application <-> Profile). PostgreSQL's robust support for constraints (Unique, Foreign Key) ensures data integrity.
-   **Tool: Spring Boot SQL Initialization (`schema.sql`)**: 
-   **Why**: Instead of using Hibernate's `ddl-auto: update` (which can be unpredictable) or heavy migration tools like Flyway, we use explicit `schema.sql` scripts. This allows us to define precise constraints (like `UNIQUE INDEX` and `ON DELETE CASCADE`) that Hibernate might not generate optimally, ensuring a "Production Stable" schema every time the app starts.

---

## 🔄 2. State Management Philosophy

### **Approach**: Server-State vs. Client-State Separation
We intentionally distinguish between data that comes from the server and data that lives purely in the browser UI.
-   **Tool: TanStack Query (Server State)**:
    -   **Rationale**: Traditional Redux for API data leads to "stale data" bugs. TanStack Query solves this by treating the server as the "Source of Truth," handling caching, refetching, and deduplication automatically.
-   **Context API (Client State)**:
    -   **Rationale**: UI-specific states like "Theme" or "Sidebar Open" are managed via React Context. This avoids the "Prop Drilling" problem while keeping the state management lean.

---

## 🔐 3. Security Strategy: The Stateless Identity

### **Approach**: Stateless JWT Authentication
We avoid traditional HTTP sessions in favor of self-contained JSON Web Tokens.
-   **Why**: **Horizontal Scalability**. In a modern cloud environment, our backend can be replicated across multiple regions. Stateless JWTs allow any instance to verify a user without needing a shared session database (like Redis).
-   **Tool: Spring Security + JJWT**:
    -   **Rationale**: Spring Security provides the industry-standard filter chain. JJWT gives us a lightweight, non-opinionated way to sign and verify tokens with **HS512** for high cryptographic strength.

### **OAuth2 Strategy**: Hybrid Flow
-   **Approach**: Google OAuth2 redirects to Backend -> Backend redirects to Frontend with JWT.
-   **Rationale**: This ensures that sensitive credentials (OAuth Client Secrets) stay on the server, while the frontend only ever sees the short-lived JWT, minimizing the attack surface.

---

## 🎨 4. Frontend Strategy: Utility-First & Accessible

### **Tool: Tailwind CSS**
-   **Approach**: Utility-First CSS.
-   **Rationale**: Writing custom CSS files often leads to "CSS bloat" and "naming fatigue." Tailwind encourages a "compositional" approach where styles are co-located with components, leading to faster development and smaller production bundles.

### **Tool: Radix UI (Shadcn)**
-   **Approach**: Headless Accessible UI.
-   **Rationale**: Building an accessible Modal or Dropdown from scratch is extremely difficult (keyboard navigation, ARIA roles, etc.). Radix handles the "Hard UI" logic (A11Y), while we handle the aesthetic styling.

---

## 🛠️ 5. Build & Tooling Strategy

### **Tool: Vite**
-   **Approach**: ESM-Based Development.
-   **Rationale**: Vite leverages modern browser support for ES Modules to provide near-instant startup. This drastically reduces the "inner loop" development time compared to traditional bundlers like Webpack.

### **Tool: Axios Interceptors**
-   **Approach**: Cross-Cutting Concern Management.
-   **Rationale**: Instead of manually passing tokens into every fetch request, we centralize this logic. This is an application of the **DRY (Don't Repeat Yourself)** principle, ensuring that security is applied consistently by default.
