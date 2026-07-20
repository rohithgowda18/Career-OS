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

---

## ⚡ 6. Filtering State, TanStack Query Key Hashing & Layout Engine

To support responsive, server-side filtering on tracking pages without client-side lag, Career OS couples React hooks state lifecycle directly with TanStack Query's cache hashing engine.

### A. TanStack Query State Hashing & Cache Key Strategy
In TanStack Query (React Query), cache lookup is driven by serialization of the `queryKey` array. When any value inside the queryKey object changes, the cache manager registers it as a cache miss and initiates a new fetch. We mapped dynamic filters directly inside the keys:

* **Applications list:** `["applications", { page, size: PAGE_SIZE, sort: "deadline,asc", status, eventType }]`
* **Placements list:** `["placements", { page, size: pageSize, sort: "id,desc", status }]`

#### 🔄 Dynamic Request Lifecycle Workflow:
1. **Dropdown Trigger:** The user changes a value in the Status select dropdown (e.g. from `"ALL"` to `"Applied"`).
2. **React State Update:** The select's `onChange` callback triggers `setStatus("Applied")`. This invokes a React virtual-DOM state transition.
3. **Query Key Hash Change:** The updated `status` state modifies the `queryKey` array argument passed to `useQuery`.
4. **Cache Evaluation:** TanStack Query performs a deterministic hash scan of the key array. Since no cached entry matching `status: "Applied"` exists, the hook transitions to the `fetching` state.
5. **API Client Invocation:** The query function executes:
   ```typescript
   applicationsApi.list({ 
     page, 
     size: PAGE_SIZE, 
     sort: "deadline,asc", 
     status: status === "ALL" ? undefined : status,
     eventType: eventType === "ALL" ? undefined : eventType
   });
   ```
   *Axios converts `undefined` parameters to omitted keys, sending a clean parameter string `?page=0&size=8&sort=deadline,asc&status=Applied`.*
6. **Result Cache Mapping:** The response payload from the backend is saved in the memory cache under the hashed query key.
7. **Cache Reuse:** If the user reverts the filter back to `"ALL"`, TanStack Query finds the key `["applications", { ..., status: "ALL", ... }]` in its internal store and instantly displays the cached records, offering a latency-free user experience.

---

### B. Out-of-Bounds Pagination Reset Strategy
A critical issue in paginated lists is "empty page drift" (where the user filters the list while on an advanced page, and the filtered subset has fewer pages than the current active page index).

1. **State Interception:** In [KanbanView.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/components/views/KanbanView.tsx) and [PlacementTable.tsx](file:///c:/Users/rohit/Desktop/Event-Tracker/apps/web/src/components/PlacementTable.tsx), select dropdowns execute a batched setter transition:
   ```typescript
   onChange={(e) => {
     setStatus(e.target.value);
     setPage(0); // Resets active page offset back to 0 (page 1)
   }}
   ```
2. **Batching:** React batches both state updates (`setStatus` and `setPage`) into a single render tick, triggering only a single REST API call with `page=0` and the selected filter.
3. **Dynamic Pagination Resolution:** The backend response correctly maps the `totalPages` and `totalElements` matching the filtered subset, allowing the pagination control row to recalculate active numbers correctly.

---

### C. Compact Responsive CSS & Layout Breakpoints
To avoid wasting valuable vertical workspace real estate on dedicated query control bars, the controls are embedded directly in existing row elements using TailwindCSS flex layouts:

#### 1. Applications Header Row
* The Status and Event selectors are placed on the right side of the main header row:
  ```html
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
    <div className="flex items-center gap-2.5">
       <!-- Icon and Title -->
    </div>
    <div className="flex flex-wrap items-center gap-3.5 self-end md:self-auto">
       <!-- Select Dropdowns and Add Application Button -->
    </div>
  </div>
  ```
* **CSS Alignment Details:**
  * `flex-col md:flex-row`: On small viewport widths, the header breaks into vertical blocks to prevent text clipping. On screens `>768px` (medium viewport), it uses horizontal layout.
  * `self-end md:self-auto`: Right-aligns the dropdowns and buttons container on small mobile screens.
  * `gap-3.5`: Enforces constant `14px` horizontal spacing between controls.

#### 2. Placements KPI Inline Layout
* The Placement Status dropdown is placed inline with the statistics row:
  ```html
  <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs text-text-muted border-b border-border/40 pb-4">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
       <!-- Opportunities, Applied, Assessments, Interviews stats -->
    </div>
    <div className="flex items-center gap-2.5">
       <!-- Status Select Dropdown inline -->
    </div>
  </div>
  ```
* **CSS Alignment Details:**
  * `justify-between`: Maximizes spacing between elements, pushing the statistics details to the left margins and the filter controls to the right margins.
  * `h-7 px-2 py-0.5`: Stylizes the select element to match the height of small text lines, aligning with the visual hierarchy of the parent metrics.
  * `bg-bg-elevated border border-border rounded-lg`: Inherits theme variables, ensuring color presets automatically update border colors and background transparency when switching themes (e.g. Retro Terminal green borders or Neo Brutalist stark lines).
