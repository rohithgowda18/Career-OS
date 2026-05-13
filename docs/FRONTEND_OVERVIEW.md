# Frontend Architecture & Rationale (React)

This document provides a senior-level technical specification of the Event Application Tracker frontend, detailing the **Framework Approaches**, **State Philosophy**, and the **UX Engineering Rationale**.

---

## 🏗️ 1. Framework Philosophy: React 19 + TypeScript

### **Approach**: Component-Driven Development
-   **Why**: We build the UI as a tree of isolated, reusable components. This reduces complexity and allows for localized debugging.
-   **Tool: TypeScript**:
    -   **Rationale**: JavaScript's dynamic nature is a liability in large-scale apps. TypeScript provides "Compile-time Validation," ensuring that an `Application` object on the frontend matches exactly what the backend sends.

---

## 🔄 2. State Management Strategy

### **Approach**: Server-State vs. Client-State Separation
A key senior-level decision is **not** to store API data in global state (like Redux).

1.  **Server State (TanStack Query)**:
    -   **Rationale**: Data from the database is "asynchronous" and "stale" by nature. TanStack Query manages the lifecycle of this data (caching, invalidation, background refetching) so we don't have to write manual `useEffect` logic.
2.  **Client State (Context API)**:
    -   **Rationale**: For purely UI state (Themes, Auth status), the built-in React Context is sufficient. It avoids the performance overhead and boilerplate of heavier libraries.

---

## 🎨 3. Styling & UX Engineering

### **Tool: Tailwind CSS**
-   **Approach**: Utility-First CSS.
-   **Rationale**:
    -   **Speed**: No more jumping between `.tsx` and `.css` files.
    -   **Maintainability**: Eliminates the "dead CSS" problem where unused styles accumulate in large stylesheets.
    -   **Bundle Size**: Tailwind's JIT compiler only generates the CSS we actually use.

### **Tool: Shadcn/UI (Radix UI)**
-   **Approach**: Headless, Accessible Components.
-   **Rationale**: We prioritize **A11Y (Accessibility)**. Radix UI handles the complex focus management, keyboard navigation, and screen reader roles, allowing us to focus on the custom "Cyber-Tech" aesthetic.

---

## 📡 4. Networking & API Layer

### **Tool: Axios + Interceptors**
-   **Approach**: Centralized Request Management.
-   **Rationale**: 
    -   **DRY (Don't Repeat Yourself)**: Instead of manually adding a JWT to every request, the **Request Interceptor** handles it globally.
    -   **Resilience**: The **Response Interceptor** catches 401/500 errors centrally, allowing the app to trigger global error toasts or redirects without polluting individual component logic.

---

## 📦 5. Build & Optimization Strategy

### **Tool: Vite**
-   **Approach**: Next-Generation Bundling.
-   **Rationale**: Vite uses ES modules for development, providing sub-second Hot Module Replacement (HMR). This significantly improves the developer experience compared to Webpack.

### **PWA (Progressive Web App)**
-   **Approach**: Offline-First Caching.
-   **Rationale**: Using `vite-plugin-pwa`, we enable service workers that cache static assets and the core app shell. This ensures the application remains functional and fast even on unstable connections.
