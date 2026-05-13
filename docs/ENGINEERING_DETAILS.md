# Engineering Excellence: Technology Stack & Rationale

As a senior-level engineer, selecting the right toolset is about balancing performance, maintainability, scalability, and developer velocity. Below is a comprehensive breakdown of the Event Application Tracker's technical architecture and the rationale behind each choice.

---

## 🏗️ Backend: Resilience & Scalability

### **1. Java 17 & Spring Boot 3.2**
*   **Why**: Java 17 (LTS) provides modern features like Records, sealed classes, and improved performance. Spring Boot 3.2 leverages these enhancements while offering a robust ecosystem for enterprise-grade microservices.
*   **Rationale**: The N-tier architecture (Controller-Service-Repository) ensures clear separation of concerns, making the system easy to test and extend.

### **2. Spring Security & JWT (JJWT)**
*   **Why**: Traditional session-based auth doesn't scale well across multiple server instances. JWT (JSON Web Token) allows for stateless, distributed authentication.
*   **Rationale**: Using JJWT (io.jsonwebtoken) gives us granular control over token generation and validation, ensuring that our security layer is both high-performance and cryptographically sound.

### **3. PostgreSQL & Spring Data JPA**
*   **Why**: PostgreSQL is the industry standard for reliable, relational data storage. Spring Data JPA abstracts the boilerplate of SQL while allowing for complex query optimization when needed.
*   **Rationale**: The use of JPA repositories ensures type-safe database interactions and simplifies common CRUD patterns, drastically reducing "plumbing" code.

### **4. Project Lombok**
*   **Why**: Java is notoriously verbose.
*   **Rationale**: Annotations like `@RequiredArgsConstructor` and `@Data` reduce boilerplate by generating constructors, getters, and setters at compile-time, keeping the source code clean and focused on business logic.

---

## 🎨 Frontend: Performance & UX

### **1. React 19 & TypeScript**
*   **Why**: React 19 introduces optimized rendering and better support for modern web standards. TypeScript adds a layer of static typing that prevents a whole class of runtime errors.
*   **Rationale**: Typing our API responses and component props ensures that the frontend remains stable as the backend evolves.

### **2. TanStack Query (React Query)**
*   **Why**: Managing server state in global state (like Redux) is often overkill and error-prone.
*   **Rationale**: TanStack Query handles caching, background refetching, and loading states out-of-the-box, significantly improving perceived performance and reducing network overhead.

### **3. Tailwind CSS & Shadcn/UI**
*   **Why**: Tailwind provides utility-first styling for rapid UI development. Shadcn/UI (built on Radix UI) offers accessible, unstyled components that we can theme.
*   **Rationale**: This combination allows us to build a premium "Cyber-Tech" interface that is fully accessible (A11Y) and responsive without the weight of a heavy UI library.

### **4. Wouter**
*   **Why**: React Router is powerful but heavy.
*   **Rationale**: Wouter is a minimalist routing solution (approx. 1KB) that fits perfectly for a performance-focused single-page application (SPA).

---

## 🛠️ Tooling & Infrastructure

### **1. Vite**
*   **Why**: Webpack is slow.
*   **Rationale**: Vite uses ES modules for lightning-fast HMR (Hot Module Replacement) and optimized production builds, keeping developer productivity high.

### **2. Maven**
*   **Why**: Standardization and dependency management.
*   **Rationale**: Maven ensures that the build process is deterministic and reproducible across different environments (local, CI/CD).

### **3. Axios Interceptors**
*   **Why**: Manual token attachment is repetitive.
*   **Rationale**: We use global interceptors to automatically inject JWT tokens and handle 401 Unauthorized redirects centrally, ensuring consistent security across all API calls.
