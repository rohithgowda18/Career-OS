# 🚀 The Ultimate Engineering Deep Dive: Event App Tracker

This document provides a **microscopic, code-level analysis** of the Event App Tracker. It is designed to act as your ultimate study guide for senior-level technical interviews. We will break down exactly **WHAT** we used, **HOW** it inherently functions at the source-code layer, and the **ENGINEERING TRADE-OFFS (WHY)** we accepted.

---

## 🏗️ Chapter 1: The Monorepo Ecosystem

### WHAT we used
*   **Structure:** NPM Workspaces (monorepo).
*   **Modules:** `apps/web` (Frontend), `apps/backend` (Backend API).

### HOW it works
The `package.json` at the root folder defines `"workspaces": ["apps/*", "packages/*"]`. When we run `npm install` at the root, npm creates a unified dependency tree and hoists shared packages (like formatting rules) to the top level. Scripts in the root folder (`npm run dev`) spawn parallel processes to boot both the React Vite server and proxy commands to the backend.

### WHY we used it (Trade-offs & Decisions)
*   **Why Monorepo vs. Polyrepo?** In a polyrepo (separate GitHub repos for front and back), a pull request that requires an API change and UI change must be coordinated perfectly across two repositories. With a Monorepo, a single PR encapsulates the full-stack feature. This ensures atomicity—if the PR reverts, both sides regress safely together.

---

## 🎨 Chapter 2: The Frontend (React 19 ecosystem)

### WHAT we used
*   **Core Build:** React 19 driven by Vite.
*   **State & Caching Data:** `@tanstack/react-query`.
*   **Styling & UI:** Tailwind CSS, Radix UI Primitives, `clsx` + `tailwind-merge`.
*   **Validation:** `react-hook-form` + `zod`.

### HOW it works (Component & Data Flow)
1.  **Vite Bundling:** Vite uses Esbuild (written in Go) to pre-bundle dependencies, making the local dev server boot in milliseconds. In production, it uses Rollup to split code into optimized chunks.
2.  **Routing:** `wouter` wraps our application, executing route-matching logic natively without the massive bundle bloat of `react-router-dom`.
3.  **Data Fetching Strategy (`React Query`):** We strictly follow the **Stale-While-Revalidate** pattern.
    *   When the user visits `/dashboard`, React Query checks its cash. It immediately renders the UI with old data (zero latency).
    *   In the background, it quietly pings `/api/applications`.
    *   If the database has newer records, it patches the UI seamlessly.
4.  **UI Component Architecture (The "shadcn/ui" philosophy):** We use Radix UI for logic. For example, a `<Dialog>` primitive from Radix handles aria-labels, focus-trapping, and ESC-key dismissal natively inside the DOM. We wrap this primitive using Tailwind classes (via `tailwind-merge` to resolve CSS conflicts) to style it. 

### WHY we used it
*   **Why React Query instead of `useEffect` fetching?** `useEffect` causes race conditions, visual tearing, and lacks a caching layer. React Query abstracts loading states, error states, and cache invalidation in a single hook (`const { data, isLoading } = useQuery(...)`).
*   **Why `clsx` and `tailwind-merge`?** Tailwind has specific class priorities. If a sub-component asks for `bg-red-500` but the parent passes `bg-blue-500`, standard CSS strings will conflict unpredictably. `tailwind-merge` safely computes the override.
*   **React Hook Form + Zod:** Uncontrolled inputs with `react-hook-form` mean the DOM doesn't re-render on every single keystroke (unlike standard controlled React forms). Zod ensures the JSON leaving the client is perfectly structured.

---

## ⚙️ Chapter 3: The Backend (Spring Boot 3.2 + Java 17)

### WHAT we used
*   **Framework Architecture:** Java 17, Spring Boot 3.2.3.
*   **Persistence Layer:** Spring Data JPA (Hibernate).
*   **Security:** Spring Security + JSON Web Tokens (JWT).

### HOW it works (The N-Tier System)
1.  **The Entrypoint (`Controller` Layer):** `ApplicationController.java` is annotated with `@RestController`. It defines pure routes (e.g., `@GetMapping("/api/applications")`). It receives JSON, deserializes it into a request DTO (Data Transfer Object), and validates it using `@Valid` annotations.
2.  **The Processor (`Service` layer):** `ApplicationService.java` is marked `@Service`. It houses all business logic (e.g., "Does this user have permission to modify this application?"). It takes the DTO, maps it to a database Entity, and hands it off.
3.  **The Data Access (`Repository` Layer):** Interfaces extending `JpaRepository`. We don't write SQL. Spring automatically generates SQL statements based on our method names (e.g., `findByUserIdAndStatus(Long id, Status status)`).
4.  **Global Exception Handling:** We utilize an `@ControllerAdvice` class. If an exception (like `ApplicationNotFoundException`) is thrown *anywhere* in the code, this class catches it globally, serializes a standardized JSON error message (`{"error": "Not Found", "code": 404}`), and sends it back to React.

### WHY we used it
*   **Why Java 17 and Spring Boot?** Node.js/Express is often seen as a fast-prototyping language. Spring Boot guarantees a type-safe, multi-threaded, enterprise-ready environment. By choosing Spring Boot, you demonstrate you can handle heavily structured, interface-driven architectural patterns that tech banks and Fortune 500 companies demand.
*   **Why map to DTOs?** We *never* expose Database Entities directly to the API. If we added an `internalAdminNotes` column to the DB Entity, Jackson might accidentally serialize it to the frontend. By mapping from Entity → DTO, we have absolute control over the API contract.

---

## 🔒 Chapter 4: Authentication & Security Flow

### WHAT we used
*   Spring Security Filter Chains.
*   `io.jsonwebtoken` (JJWT).
*   BCrypt Hashing constraint.

### HOW it works step-by-step
1.  **Registration:** A user posts `{ "password": "my_password" }`. The backend intercepts this, runs it through `BCryptPasswordEncoder`, and stores a non-reversible hash in PostgreSQL (e.g., `$2a$10$w...`).
2.  **Login:** They send credentials. Spring Security verifies the hash. We then use a secret server key to sign a JWT payload containing their `userId` and `roles`. The JWT string is sent back.
3.  **Authenticated Request:** React attaches `Authorization: Bearer <token>` to all future requests.
4.  **The Filter (`JwtAuthenticationFilter`):** Every request coming into Spring Boot MUST pass through our extending `OncePerRequestFilter`. It reads the header, cryptographically verifies the token wasn't tampered with, extracts the `userId`, and loads the `UserDetails` deeply into the `SecurityContextHolder`.

### WHY we used it
*   **Why Stateless JWT over Session Cookies?** A session requires the server's RAM to remember the user. If we scale to 5 servers, Server A doesn't know the session started on Server B unless we set up a messy Redis cache. JWT is mathematically verified; any of the 5 servers can independently read the token and trust it locally.

---

## 🗄️ Chapter 5: Database & Migration Engine

### WHAT we used
*   PostgreSQL 13 (Relational Database).
*   Flyway (Schema Migration).

### HOW it works
*   In `resources/db/migration/`, we store raw SQL files like `V1__Initial.sql`. 
*   When Spring boots, Flyway connects to PostgreSQL first. It tracks versions in a secure table. If it sees `V2__Add_Column.sql` on disk but not in the DB, it executes it lock-safe.

### WHY we used it
*   **Strict Relational Logic:** Event Applications are naturally relational to Users (`@ManyToOne`). NoSQL (like MongoDB) would force us to manually handle orphaned records if a User deletes their account. PostgreSQL guarantees referential integrity via Foreign Keys.
*   **Flyway Determinism:** If a developer manually runs an `ALTER TABLE` UI query, that schema is completely out of sync with the codebase. Flyway guarantees the codebase dictates the database structure. 

---

## 🤖 Chapter 6: Deep Dive into the AI URL Parsing System

This is your flagship talking point for technical ingenuity.

### WHAT we used
*   **Jsoup:** High-performance, memory-efficient Java HTML DOM parser.
*   **Langchain4j:** The Java adaptation of LangChain.
*   **Groq API:** Cloud-hosted Inference, running high-speed LLMs (LLaMA/Mistral).

### HOW it works (The exact pipeline)
1.  **The Fetch:** When user posts `{ "url": "https://..." }`, the backend invokes Jsoup: `Document doc = Jsoup.connect(url).get()`.
2.  **The Sanitization:** HTML is massive. A website might be 50,000 tokens of CSS and JS. Jsoup strips tags (`doc.text()`) to get just the plaintext bytes. 
3.  **The Prompt:** We inject the text into a strict instruction template: 
    *"You are an Event Data Extractor. Parse the following text. Output ONLY a valid JSON object matching this schema: `{ eventName, deadline, type }`. Do not output markdown code blocks. Here is the text: [SANITIZED_TEXT] "*
4.  **Inference:** Langchain4j manages the HTTP network call out to the Groq rest API. 
5.  **Rehydration:** We use `ObjectMapper` to convert the Groq JSON string directly into an `ApplicationDTO`, which travels safely back to the React UI as a perfect object.

### WHY we used it
*   **Speed is Priority:** LLM APIs (like OpenAI GPT-4) can take up to 7-10 seconds to generate a response. In a UI form, anything longer than 2 seconds feels broken. Groq uses physical silicon built explicitly for Language algorithms (LPU), offering unparalleled 800+ tokens/second. The user gets their AI-parsed data almost instantly.
*   **Extensibility with Langchain4j:** By wrapping the AI call in Langchain4j interfaces, our backend is entirely decoupled from the specific AI provider. If Groq shuts down, we can swap the bean configuration to OpenAI in 60 seconds without rewriting the core extraction logic.

---

## 🔄 Chapter 7: The Bridge Migration (tRPC to REST)
*(If asked: "What was the hardest architectural challenge you solved?")*

**The Challenge:** The frontend originally used `tRPC`—a library that creates type-safe RPC endpoints natively coupled to a TypeScript (Node.js) backend. When migrating the backend to Java, tRPC completely broke, as it cannot talk to Java.

**How we solved it:** 
Instead of rewriting 100% of the React components (which would take weeks and cause massive bugs), we wrote a **REST Compatibility Layer**. We mapped the `trpc.application.useQuery()` calls over to standard `axios.get()` or `fetch()` calls tied into `@tanstack/react-query`. We maintained the exact same client-side interfaces and models, but replaced the underlying transport protocol. This is a classic **Adapter Pattern**, achieving a successful backend language switch without freezing frontend feature development.
