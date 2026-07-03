# Career OS: React Frontend Client

This sub-project contains the frontend single-page application (SPA) client for Career OS (Event & Placement Tracker), built using React 19, TypeScript, Tailwind CSS, and Vite.

---

## 🛠️ Technology Stack

*   **React 19**: Utilizing modern concurrent features and performance updates.
*   **TypeScript**: Static typing for components, database models, and API responses.
*   **Vite**: Dev server with fast Hot Module Replacement (HMR) and optimized build bundles.
*   **TanStack Query (React Query) v5**: Server state synchronization, caching, and loading state management.
*   **Tailwind CSS**: Utility-first styling framework.
*   **Shadcn/UI + Radix UI**: Fully styled accessible component primitives (accessible select, dropdown, dialog modals).
*   **Recharts**: SVG charting engine for visual insights (bar charts, area charts, and pie charts).
*   **Wouter**: Lightweight client routing engine (~1KB package size).
*   **Axios + Interceptors**: Http client routing with JWT security injection and 401 token expiration handling.
*   **Vite PWA**: Service worker caching support (`sw.ts`) for offline resilience.

---

## 📂 Project Structure

```
apps/web/
├── public/                # Static assets (icons, manifest.json)
├── vercel.json            # Vercel SPA route rewrite rules
├── index.html             # Shell template
├── package.json           # Frontend dependencies and run scripts
├── tsconfig.json          # TypeScript configurations
├── vite.config.ts         # Vite bundler configurations
└── src/
    ├── main.tsx           # Entry mounting file
    ├── App.tsx            # Main layout wrapper and page router
    ├── index.css          # Theme variables, utility styles, and typography
    ├── sw.ts              # Service worker script (PWA)
    ├── components/
    │   ├── ui/            # Shadcn component primitives (button, input, dialogue)
    │   ├── views/         # Layout view interfaces (CalendarView, KanbanView, PlacementKanbanView)
    │   ├── ui/            # Primitive components (buttons, input fields)
    │   ├── AddPlacementModal.tsx      # Modal to log placements with AI Parser
    │   ├── AddApplicationModal.tsx    # Modal to log events
    │   ├── PlacementTable.tsx         # Sorting placements list table
    │   └── AnalyticsDashboard.tsx     # Charts, yield indicators, and trends dashboard
    ├── contexts/
    │   └── ThemeContext.tsx           # Dark/Light theme state
    ├── hooks/
    │   └── useAuth.ts                 # React query authentication status hook
    ├── lib/
    │   ├── restClient.ts              # Axios interceptors config
    │   ├── utils.ts                   # Date formats, tailwind utilities helpers
    │   └── api/                       # REST client methods
    │       ├── authApi.ts
    │       ├── applicationsApi.ts
    │       ├── placementsApi.ts
    │       ├── analyticsApi.ts
    │       └── userApi.ts
    ├── pages/
    │   ├── LandingPage.tsx            # Public landing layout
    │   ├── LoginPage.tsx              # Auth forms layout
    │   ├── Home.tsx                   # Main workspace dashboard
    │   ├── PlacementsPage.tsx         # Placement hub page
    │   ├── AddEventPage.tsx           # Scraper bookmarklet landing page
    │   └── OAuthSuccessPage.tsx       # OAuth redirection handler
    └── types/
        └── db-types.ts                # Typings matching database entities
```

---

## 🏁 Local Configuration & Setup

### 1. Requirements
Ensure you have **Node.js (v18+)** installed.

### 2. Configure Environment Variables
Create a `.env` file in this directory or rely on the workspace `.env`:
```ini
# Base URL pointing to the running backend REST server
VITE_API_URL=http://localhost:8080
```

### 3. Run Dev Server
```bash
# Install dependencies
npm install

# Run Vite local server (runs on port 5173 by default)
npm run dev
```

### 4. Build for Production
```bash
# Compile TypeScript and bundle assets
npm run build

# Preview production build locally
npm run start
```

---

## 🚀 Vercel Deployment Settings

When deploying to [Vercel](https://vercel.com):
-   **Framework Preset**: Select `Vite`.
-   **Root Directory**: Set to `apps/web`.
-   **Build Command**: `npm run build` or `pnpm run build`.
-   **Output Directory**: `dist`.
-   **Environment Variables**: Ensure `VITE_API_URL` is set to your deployed backend URL.

### SPA Router Redirects
The [vercel.json](vercel.json) file contains the rewrite rule:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This forces Vercel to route all client paths to `index.html`, allowing the frontend client router (`wouter`) to manage routes gracefully without returning HTTP 404.