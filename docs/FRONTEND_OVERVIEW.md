# Frontend Architecture & PWA Developer Guide

This document provides a comprehensive blueprint of the Opportunity Management Platform (OMP) React frontend.

---

## 🛠️ 1. Core Technology Stack
-   **React 18**: Dynamic UI updates and state-driven DOM rendering.
-   **Vite**: Next-generation frontend tooling providing hot module replacement (HMR) and optimized rollup production bundles.
-   **TailwindCSS & TailwindVite**: Utility-first styling engine integrated directly into the build pipeline.
-   **TypeScript**: Enforces strict type boundaries across API models, utility helpers, and component properties.
-   **Wouter**: An ultralight routing alternative to React Router, optimized for bundle size and speed.
-   **TanStack Query (React Query v5)**: Manages asynchronous server state, fetching, mutation states, caching policies, and queries invalidations.
-   **Lucide React**: Vector icon set used for interface actions.

---

## 📂 2. File and Directory Structure
The frontend application lives under `apps/web/`:
```
apps/web/
├── public/                 # Static assets (PWA app icons, manifest assets)
├── src/
│   ├── components/         # Global shared components
│   │   ├── ui/             # Shadcn primitives (Dialog, Button, Input, Dropdowns)
│   │   ├── views/          # Sub-view panels mapped to dashboard paths
│   │   │   ├── DashboardView.tsx       # Core dashboard metrics list
│   │   │   ├── CalendarView.tsx        # Event deadlines calendar
│   │   │   ├── PlacementKanbanView.tsx # Placement application boards
│   │   ├── DashboardLayout.tsx         # Root container shell with shell UI
│   ├── contexts/           # React Context Providers (ThemeContext)
│   ├── hooks/              # Custom React hooks (useAuth, usePWAInstall)
│   ├── lib/                # Config files and API wrappers
│   │   ├── api/            # Individual domain API endpoints (authApi, applicationsApi)
│   │   ├── restClient.ts   # Axios instance with request/response interceptors
│   ├── pages/              # Route level entry pages (LandingPage, LoginPage, Home)
│   ├── theme/              # Presets and styles defining theme layouts
│   ├── App.tsx             # Primary root app router configuration
│   ├── index.css           # Global CSS variables and utility definitions
│   └── main.tsx            # Main DOM entrypoint, registering service workers
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🧭 3. Routing Architecture
We use [wouter](https://github.com/molecula-org/wouter) for application routing. The routing configuration is defined in [App.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/App.tsx) and handles the following endpoints:
-   `/`: [LandingPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/LandingPage.tsx) - Main product showcase.
-   `/login`: [LoginPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/LoginPage.tsx) - Credentials sign-in and registration forms.
-   `/oauth-success`: [OAuthSuccessPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/OAuthSuccessPage.tsx) - Redirection target following successful Google/GitHub authentication.
-   `/dashboard`: [Home.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/Home.tsx) - Protected workspace view.
-   `/placements`: [PlacementsPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/PlacementsPage.tsx) - Structured job application list.
-   `/add`: [AddEventPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/AddEventPage.tsx) - Dedicated page for adding a single tracking record.

---

## 🎨 4. Theme Engine Configuration
OMP utilizes a custom design system with support for five distinct UI themes. The active theme tokens are configured via `ThemeContext.tsx` and map CSS custom properties inside `theme/presets/` files:
1.  **Glass (Default)**: Sleek modern translucent surfaces with subtle glassmorphic blurs (`theme/presets/glass.ts`).
2.  **Cyberpunk**: High contrast dark neon palette featuring yellow borders and intense pink/violet highlights (`theme/presets/cyberpunk.ts`).
3.  **Neo Brutalist**: Thick stark shadows, high-contrast black borders, and primary green colors (`theme/presets/brutalist.ts`).
4.  **Retro Terminal**: Monochromatic retro green layouts with monospace fonts resembling console layouts (`theme/presets/terminal.ts`).
5.  **Claymorphism**: Soft, rounded pastel colored shapes with subtle inner shadows (`theme/presets/claymorphism.ts`).

---

## 📱 5. PWA (Progressive Web App) Deep Dive

The PWA is configured using `vite-plugin-pwa` in [vite.config.ts](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/vite.config.ts).

### Service Worker & Lifecycle
-   **Mode**: `registerType: "autoUpdate"`. The service worker checks for new manifest maps or assets on startup.
-   **Caching Strategy**: Workbox pre-caches static resources matching `**/*.{js,css,html,ico,png,svg,webmanifest}` to make sure the app works offline.

### Manual Update Checks
To bypass the browser's slow update checking heuristics, the **Check for Updates** button in [DashboardLayout.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/components/DashboardLayout.tsx) executes a manual registration update check:
```typescript
const checkForUpdates = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.update();
  }
};
```
If Vercel has served an update, it triggers a custom `"pwa-update-available"` event. The UI intercepts this event and displays an interactive Toast notification prompting the user to click **"Update"**, which reloads the page with the new service worker immediately.

### 🛡️ 3-Tier Session Persistence
To counter mobile OS sandboxes (especially WebKit/iOS WebClip wrappers) wiping `localStorage` directories on app shutdown, we store the JWT in three separate browser stores:
1.  **LocalStorage**: Accessed synchronously for immediate API setups on application mount.
2.  **Document Cookie**: Written with a 15-day `max-age` and a `secure` flag on HTTPS connections.
3.  **IndexedDB**: Persistent relational storage (`OMPAuthDB`) that does not get cleared during browser cache purges.

#### Token Retrieval Strategy (`restClient.ts` Request Interceptor)
```typescript
const getStoredTokenAsync = async () => {
  // 1. Try LocalStorage
  let token = localStorage.getItem('token');
  if (token) return token;

  // 2. Fallback to Cookie
  const match = document.cookie.match(/(^| )token=([^;]+)/);
  if (match) {
    token = match[2];
    localStorage.setItem('token', token);
    await saveTokenToIndexedDB(token);
    return token;
  }

  // 3. Fallback to IndexedDB (keeps users logged in on mobile PWA restarts)
  token = await getTokenFromIndexedDB();
  if (token) {
    localStorage.setItem('token', token);
    const secureFlag = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `token=${token}; max-age=1296000; path=/; samesite=lax${secureFlag}`;
    return token;
  }
  return null;
};
```
This multi-tier recovery pipeline heals the application state seamlessly on launch.
