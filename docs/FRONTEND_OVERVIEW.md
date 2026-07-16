# Frontend Architecture & PWA Developer Guide

This document provides a comprehensive blueprint of the Career OS React frontend.

---

## 🛠️ 1. Core Technology Stack
-   **React 18**: Dynamic UI updates and state-driven DOM rendering.
-   **Vite**: Next-generation frontend tooling providing hot module replacement (HMR) and optimized rollup production bundles.
-   **TailwindCSS**: Utility-first styling engine integrated directly into the build pipeline.
-   **TypeScript**: Enforces strict type boundaries across API models, utility helpers, and component properties.
-   **Wouter**: An ultralight routing alternative to React Router, optimized for bundle size and speed.
-   **TanStack Query (React Query v5)**: Manages asynchronous server state, fetching, mutation states, caching policies, and query invalidations.
-   **Lucide React**: Vector icon set used for interface actions.

---

## 📂 2. File and Directory Structure
The frontend application lives under `apps/web/`:
```
apps/web/
├── public/                 # Static assets (PWA app icons, static manifest.webmanifest)
├── src/
│   ├── components/         # Global shared components
│   │   ├── ui/             # Shadcn primitives (Dialog, Button, Input, Dropdowns)
│   │   ├── views/          # Sub-view panels mapped to dashboard paths
│   │   │   ├── DashboardView.tsx       # Core dashboard metrics list
│   │   │   ├── CalendarView.tsx        # Event deadlines calendar
│   │   │   ├── KanbanView.tsx          # Placement application boards
│   │   ├── DashboardLayout.tsx         # Root container shell with sidebar navigation
│   │   ├── SkillTable.tsx              # Organized professional skills grouped by domains
│   │   ├── EditCategorySkillsModal.tsx # Dialog to batch-edit levels and manage deletions per category
│   │   ├── AddSkillModal.tsx           # Track selectors, badge status, and smart recommendation chips
│   ├── contexts/           # React Context Providers (ThemeContext)
│   ├── hooks/              # Custom React hooks (useAuth)
│   ├── lib/                # Config files and API wrappers
│   │   ├── api/            # Individual domain API endpoints (authApi, skillsApi)
│   │   ├── restClient.ts   # Axios instance with request/response interceptors
│   ├── pages/              # Route level entry pages (LandingPage, LoginPage, Home)
│   ├── theme/              # Presets and styles defining theme layouts
│   ├── App.tsx             # Primary root app router configuration
│   ├── index.css           # Global CSS variables and utility definitions
│   └── main.tsx            # Main DOM entrypoint, registering service workers in prod
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🧭 3. Routing Architecture
We use [wouter](https://github.com/molecula-org/wouter) for application routing. The routing configuration is defined in [App.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/App.tsx) and handles the following endpoints:
-   `/`: [LandingPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/LandingPage.tsx) - Main product showcase.
-   `/login`: [LoginPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/LoginPage.tsx) - Credentials sign-in and registration forms.
-   `/oauth-success`: [OAuthSuccessPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/OAuthSuccessPage.tsx) - Redirection target following successful Google/GitHub authentication.
-   `/dashboard`: [Home.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/Home.tsx) - Protected workspace view (routing sub-views for dashboard, kanban, calendar, analytics, skills, and profile).

---

## 🎨 4. Theme Engine Configuration
Career OS utilizes a custom design system with support for five distinct UI themes. The active theme tokens are configured via `ThemeContext.tsx` and map CSS custom properties inside `theme/presets/` files:
1.  **Glass (Default)**: Sleek modern translucent surfaces with subtle glassmorphic blurs.
2.  **Cyberpunk**: High contrast dark neon palette featuring yellow borders and intense pink/violet highlights.
3.  **Neo Brutalist**: Thick stark shadows, high-contrast black borders, and primary green colors.
4.  **Retro Terminal**: Monochromatic retro green layouts with monospace fonts resembling console layouts.
5.  **Claymorphism**: Soft, rounded pastel colored shapes with subtle inner shadows.

---

## 📱 5. PWA (Progressive Web App) Deep Dive

The PWA is configured using `vite-plugin-pwa` in [vite.config.ts](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/vite.config.ts).

### Service Worker & Manifest
-   **Static Manifest**: A physical web manifest is served directly from `/public/manifest.webmanifest` to ensure it resolves cleanly without syntax errors or dynamic HMR warnings in development.
-   **Dev Mode**: PWA service worker generation is suppressed (`devOptions.enabled = false` and conditional registration wrapped in `main.tsx`) to prevent development worker collisions.
-   **Production Caching Strategy**: Workbox pre-caches static resources matching `**/*.{js,css,html,ico,png,svg,webmanifest}` to make sure the app works offline.

### 🔐 OAuth Popup postMessage Protocol
To coordinate Google/GitHub authentication inside mobile or desktop standalone PWA environments, login requests invoke secure popups:
1.  **Main window** opens the login popup and attaches a listener for `"message"` events.
2.  **Popup window** completes authentication on the backend and redirects to `/oauth-success`.
3.  **Callback page** ([OAuthSuccessPage.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/pages/OAuthSuccessPage.tsx)) extracts the JWT token and uses `postMessage()` to pass it back to the parent window before closing automatically.
4.  If the popup is blocked or closed prematurely without credentials sync, the UI falls back to manual retry flags instead of silent loops.
