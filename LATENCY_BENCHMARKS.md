# API Latency Benchmark & Performance Report

This document records the empirical latency metrics measured across all API endpoints in **Career-OS** (Spring Boot Microservices + React Frontend), breaking down initial cold-start vs steady-state performance, root causes, and frontend accessibility diagnostics.

---

## 1. Latency Classification Tiers

| Tier | Latency Range | Status | Assessment / Expectation |
|---|---|---|---|
| 🟢 **FAST** | `< 200 ms` | **Excellent** | Optimal response time for responsive UI interactions, cached reads, and fast transactional queries. |
| 🟡 **OK** | `200 ms – 500 ms` | **Acceptable** | Expected for secure hashing (BCrypt), complex multi-table joins, or uncached database mutations. |
| 🟠 **SLOW / COLD-START** | `500 ms – 1.0 s` | **Investigate / Warmup** | Typical for first-request JVM JIT compilation, HikariCP connection pool spinup, and Hibernate schema validation. |
| 🔴 **DEGRADED** | `1.0 s – 3.0 s` | **Action Required** | Blocked threads, high concurrency bottlenecks, or unindexed slow database queries. |
| ⛔ **CRITICAL** | `> 3.0 s` | **Critical Issue** | Severe bottleneck, service timeout, or network deadlock. |

---

## 2. Empirical Benchmark Measurements

### A. Initial Load / Cold-Start (First Request to Backend)
When the React frontend first boots and makes concurrent queries before JVM JIT warm-up and HikariCP connection acquisition:

| Endpoint | Method | Response Time | Status | Root Cause / Context |
|---|---|---|---|---|
| `/api/auth/me` | `GET` | **751 ms** | 🟠 SLOW | Initial session validation, JWT filter bootstrap, first DB user lookup |
| `/api/analytics/dashboard` | `GET` | **626 ms** | 🟠 SLOW | Aggregation queries execution during cold JVM startup |
| `/api/routines` | `GET` | **545 ms** | 🟠 SLOW | First Hibernate query execution & table mapping |
| `/api/routines/reports` | `GET` | **529 ms** | 🟠 SLOW | Routine statistics collection on cold connection |

---

### B. Steady-State Read Operations (Warm JVM & Connection Pool)
Once the backend runtime has warmed up, read operations demonstrate high throughput and sub-100ms response times:

| Endpoint | Method | Response Time | Status | Performance Assessment |
|---|---|---|---|---|
| `/api/placements` | `GET` | **38 ms – 62 ms** | 🟢 FAST | Extremely fast, optimized index query |
| `/api/applications` | `GET` | **40 ms – 77 ms** | 🟢 FAST | Highly responsive application list fetch |
| `/api/routines/reports` | `GET` | **43 ms – 74 ms** | 🟢 FAST | ~10x speedup compared to cold-start (529ms → 43ms) |
| `/api/routines` | `GET` | **45 ms – 94 ms** | 🟢 FAST | ~10x speedup compared to cold-start (545ms → 45ms) |
| `/api/analytics/placements` | `GET` | **41 ms – 51 ms** | 🟢 FAST | Fast analytical aggregation |
| `/api/skills` | `GET` | **51 ms – 190 ms** | 🟢 FAST | Quick retrieval across multiple skill categories |
| `/api/analytics/placements/trends` | `GET` | **60 ms** | 🟢 FAST | Trend timeline computation in real-time |
| `/api/analytics/applications` | `GET` | **81 ms** | 🟢 FAST | Application metrics aggregation |
| `/api/auth/me` | `GET` | **75 ms – 88 ms** | 🟢 FAST | Validates cached/indexed user context |
| `/api/profile` | `GET` | **80 ms – 233 ms** | 🟢 FAST / 🟡 OK | User profile & preference retrieval |
| `/api/analytics/dashboard` | `GET` | **95 ms** | 🟢 FAST | ~6.5x speedup compared to cold-start (626ms → 95ms) |

---

### C. Mutations & Write Operations (POST / PUT)
Database writes and cryptographic operations:

| Endpoint | Method | Response Time | Status | Architectural Explanation |
|---|---|---|---|---|
| `/api/auth/login` | `POST` | **418 ms** | 🟡 OK | **Expected & Secure**: Intentional CPU cost for `BCryptPasswordEncoder` (work factor 10-12) to defend against brute-force attacks. |
| `/api/routines` | `POST` | **248 ms** | 🟡 OK | Validates payload, persists routine entity, and flushes transaction. |
| `/api/routines/:id/toggle` | `PUT` | **70 ms** | 🟢 FAST | Fast single-row boolean flip transaction. |
| `/api/applications` | `POST` | **117 ms** | 🟢 FAST | Creates application record and links relations. |
| `/api/placements` | `POST` | **91 ms** | 🟢 FAST | Inserts placement log record. |
| `/api/skills` | `POST` | **176 ms** | 🟢 FAST | Persists new skill record and category relation. |
| `/api/skills/:id` | `PUT` | **147 ms – 180 ms** | 🟢 FAST | Updates proficiency rating and status across multiple items. |
| `/api/auth/me/display-name` | `PUT` | **76 ms** | 🟢 FAST | Fast single-field update in user entity. |
| `/api/profile` | `PUT` | **85 ms** | 🟢 FAST | Updates user profile metadata. |

---

## 3. Frontend Diagnostic Findings

### Radix UI Dialog Warning
```text
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
```
- **Origin**: `@radix-ui/react-dialog` inside components like `AddSkillModal`, `EditCategorySkillsModal`, `AddApplicationModal`, and `AddPlacementModal`.
- **Reason**: Accessibility (a11y) guidelines require either a `<DialogDescription>` child component inside `<DialogContent>` or an explicit `aria-describedby={undefined}` prop if no description text is rendered.
- **Resolution**:
  1. Add `<DialogDescription className="sr-only">Modal description here</DialogDescription>` to modal bodies, or
  2. Add `aria-describedby={undefined}` directly to `<DialogContent>`.

---

## 4. Key Takeaways & Recommendations

1. **Production-Ready Read Performance**:
   All core read endpoints (`/api/applications`, `/api/placements`, `/api/routines`, `/api/analytics/*`) consistently respond in **under 100 ms**, providing a snappy UI experience.

2. **Cold-Start Warmup**:
   Initial requests take ~500–750 ms due to class loading, Hibernate ORM reflection, and initial HikariCP connection handshake. For production deployments with Docker / Kubernetes, an application readiness probe hitting `/api/actuator/health` or a warmup hook pre-populates these pools.

3. **Secure Auth Latency**:
   The `418 ms` response for `/api/auth/login` is normal and healthy for cryptographic BCrypt password hashing.
