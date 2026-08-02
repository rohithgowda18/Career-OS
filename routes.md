# ROUTING INTELLIGENCE & MAP — CAREER OS

## 1. CLIENT-SIDE ROUTING (WOUTER)

Client-side navigation is managed by **Wouter** in `apps/web/src/App.tsx`. Lazy loading is implemented via `React.lazy()` for all route components to minimize initial payload size.

### Route Guard & Middleware Logic

```
   HTTP Request / Route Change
              │
              ▼
   [ Route Guard Hook (useEffect in Router) ]
              │
   Is Auth State Loading? ─────► YES ─────► Show Loader / Server Warmup UI
              │ NO
              ▼
   Is User Authenticated?
      ├── YES ──► Target path is "/" or "/login"?
      │              ├── YES ──► Redirect to "/dashboard"
      │              └── NO  ──► Render Target Component
      │
      └── NO   ──► Target path is "/dashboard", "/placements", or "/add"?
                     ├── YES ──► Redirect to "/login"
                     └── NO  ──► Render Target Component
```

---

## 2. COMPLETE ROUTES TABLE

| Route Path | Component File | Protection Status | Layout Wrapper | Purpose / Functionality |
| --- | --- | --- | --- | --- |
| `/` | `LandingPage.tsx` | Public | None | Hero landing page showcasing platform value, feature previews, and CTAs |
| `/login` | `LoginPage.tsx` | Public | None | User authentication portal (Email/Password forms & Google/GitHub OAuth buttons) |
| `/oauth-success` | `OAuthSuccessPage.tsx` | Public / Callback | None | Intercepts OAuth redirect, extracts `?token=...` parameter, saves to `localStorage`, redirects to `/dashboard` |
| `/dashboard` | `Home.tsx` | **Protected** | `DashboardLayout.tsx` | Main dashboard view housing Overview widgets, Action items, Calendar, Kanban, Routine & Analytics tabs |
| `/placements` | `PlacementsPage.tsx` | **Protected** | `DashboardLayout.tsx` | Specialized campus placement drive management table and card view |
| `/add` | `AddEventPage.tsx` | **Protected** | `DashboardLayout.tsx` | Dedicated application/event creation view with manual input and AI URL extraction |
| `/privacy` | `PrivacyPage.tsx` | Public | None | Static platform terms and privacy policy statement |
| `/404` | `NotFound.tsx` | Public | None | Standard 404 page for unmatched routes |

---

## 3. DASHBOARD INTERNAL VIEW ROUTING

Within `/dashboard`, sub-view switching is managed via local view tab state in `Home.tsx` / `DashboardLayout.tsx`:

- **Overview Tab (`DashboardView.tsx`)**: High-level metrics, priority application cards, recent activity, and quick stats.
- **Calendar Tab (`CalendarView.tsx`)**: Interactive month/week grid displaying application deadlines, interview dates, and assessment timings.
- **Kanban Board Tab (`KanbanView.tsx`)**: Column-based drag-and-drop / status progression board (`SAVED` -> `APPLIED` -> `INTERVIEW` -> `OFFER` / `REJECTED`).
- **Routine Tracker Tab (`RoutineView.tsx`)**: Daily task completion list, daily checkboxes, and streak metrics.
- **Skills Matrix Tab (`SkillsPage.tsx`)**: Category-wise skills list (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`) with modal editing.
