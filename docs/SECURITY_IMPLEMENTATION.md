# Security Implementation & Rationale

This document provides a senior-level technical specification of the security architecture, detailing the **Security Philosophy**, **Auth Flows**, and **Risk Mitigation Rationale**.

---

## 🛡️ 1. Security Philosophy: Defense in Depth

### **Approach**: Statelessness & Decentralized Identity
We intentionally avoid server-side sessions.
-   **Why**: **Horizontal Scalability**. If we deploy the backend to multiple containers, any container can verify a user without needing a shared session database. This simplifies deployment and reduces infrastructure costs.

---

## 🔑 2. Authentication Strategy: JWT (JSON Web Tokens)

### **Tool: JJWT (io.jsonwebtoken)**
-   **Approach**: Signed Claims with HS512.
-   **Rationale**:
    -   **Performance**: Verification happens in memory on the backend without a database round-trip.
    -   **Integrity**: The **HS512** signature ensures that if a single bit of the token is changed by an attacker, the signature becomes invalid.
    -   **Validation Logic**: We enforce a **64-byte minimum secret key** check at startup. This prevents weak keys from being used in production, mitigating brute-force risks.

### Token Structure Detail
-   **Claims**: `userId`, `email`, `iat`, `exp`.
-   **Rationale**: We include the `email` to avoid an extra database lookup when a service needs the user's primary identifier.

---

## 🌐 3. OAuth2 Integration (Google)

### **Approach**: Backend-Server-to-Server Handshake
-   **Rationale**: We perform the OAuth code exchange entirely on the backend (`OAuth2LoginSuccessHandler`).
    -   **Risk Mitigation**: This keeps the **Client Secret** secure on the server. If the exchange happened on the frontend, the secret would be exposed to the public.
    -   **User Provisioning**: Our custom handler automatically links the Google account to a local `User` record, ensuring a unified identity across both login methods.

---

## 🚦 4. Network Security & CORS

### **Approach**: Strict Origin Whitelisting
-   **Implementation**: `SecurityConfig.corsConfigurationSource()`.
-   **Rationale**: By default, browsers block cross-origin requests. We explicitly whitelist only the known frontend URL.
    -   **Header Exposure**: We expose the `Authorization` header specifically so the frontend can read the JWT during certain flows.
    -   **CSRF Strategy**: Because we use **Stateless JWTs** (not cookies), the application is inherently protected against traditional CSRF attacks, allowing us to safely disable the CSRF filter.

---

## 💻 5. Frontend Security Interceptors

### **Approach**: Global Interception
-   **Implementation**: `restClient.ts`.
-   **Rationale**: 
    -   **3-Tier Token Persistence**: To guarantee that the session persists even in standalone mobile PWA wrappers (where mobile OSs aggressively wipe `localStorage` on app close), the token is saved concurrently in `localStorage`, persistent `document.cookie` (with the `secure` flag on HTTPS), and `IndexedDB`. When relaunching the PWA, an async request interceptor fallback automatically restores the token from `IndexedDB` to heal the state.
    -   **Graceful Degradation**: If the token expires (after 15 days), the **Response Interceptor** catches the `401` error, clears the invalid token across all three storage layers, and redirects the user to login, providing a seamless UX.
