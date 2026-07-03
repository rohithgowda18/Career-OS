# PROJECT SCORECARD
### Career OS — Event & Placement Tracker
**Recruiter-Style Evaluation Report**
**Date:** 2026-07-02 | **Evaluator:** Senior Technical Recruiter + Staff Engineer (L6/L7)

---

## EXECUTIVE SUMMARY

**Project Name:** Career OS — Event & Placement Tracker
**Type:** Full-Stack Portfolio Project (Monorepo)
**Stack:** Java 17 / Spring Boot 3.2 + React 19 / TypeScript + PostgreSQL + Gemini AI
**Deployment:** Vercel (Frontend) + Render (Backend) + Neon (Database)

**Would Recommend:** **YES** — for entry-level to mid-level engineering roles

---

## SCORES (1-10)

| Category | Score | Evaluation |
|---|---|---|
| **Backend** | 7.5/10 | N-tier architecture, JWT+OAuth2, 25+ endpoints, AI integration, Pageable, custom JPQL. Loses points for no service interfaces, stream-based analytics, no caching. |
| **Frontend** | 8.0/10 | React 19, TanStack Query, 5 views (dashboard/kanban/calendar/analytics/profile), PWA, Framer Motion animations, code-splitting. Loses points for console.log in production, hard navigation. |
| **Database** | 6.5/10 | Proper schema design, indexes, unique constraints, cascade deletes. Loses points for no Flyway, no enum CHECK constraints, stream-based aggregation instead of SQL GROUP BY. |
| **Security** | 4.5/10 | BCrypt, JWT HS512 with key validation, CORS, CSRF-disabled correctly, OAuth2 CRLF prevention. Critically loses points for public Actuator, JWT in localStorage, no rate limiting. |
| **Architecture** | 7.5/10 | Clean N-tier monorepo, proper layer separation, DTO isolation, lazy loading. Loses points for no service interfaces, no caching, no CD pipeline. |
| **Performance** | 6.0/10 | Paginated API, lazy React loading, PWA caching. Loses points for DB hit per JWT filter request, stream-based analytics aggregation. |
| **Deployment** | 6.5/10 | Docker multi-stage, non-root container user, JVM tuning, Vercel SPA routing. Loses points for no CD, no docker-compose, ddl-auto:update in prod. |
| **Testing** | 1.5/10 | 2 integration smoke tests, 0 unit tests, 0 frontend tests, 1 disabled test. Nearly absent. |
| **Documentation** | 7.0/10 | Professional README, 6 engineering docs, Postman collection, Swagger UI. Loses points for outdated API routes in README. |
| **Innovation** | 7.5/10 | Gemini AI extraction with retry + URL preservation + schema reflection. PWA. Dual OAuth. 5-stage analytics dashboard. |
| **Code Quality** | 7.0/10 | Consistent N-tier, Lombok, @Transactional, LAZY fetching, enum-safe parsing. Loses for DRY violation (normalizeUrl), raw entities in dashboard response. |
| **Resume Value** | 8.0/10 | Full-stack + AI + PWA + OAuth + Analytics + Docker + deployed. Stands out among college projects. |
| **Overall** | **6.8/10** | Strong portfolio project. Production-viable with 4-5 targeted fixes. |

---

## COMPANY FIT ASSESSMENT

| Company | Would Pass Resume Screen | Would Get Technical Interview | Would Impress Recruiter | Notes |
|---|---|---|---|---|
| **Google** | MAYBE | MAYBE | YES | Testing gap is a concern for L4+; AI + full-stack + deployed is impressive |
| **Microsoft** | YES | YES | YES | Good N-tier, deployment story, documentation |
| **Amazon** | YES | YES | YES | Leadership principles: ownership (deployed), customer obsession (UX), dive deep (AI) |
| **Uber** | YES | YES | YES | Real production deployment + performance awareness |
| **Atlassian** | YES | YES | YES | Clean code, docs, security awareness (even if partial) |
| **Stripe** | MAYBE | MAYBE | YES | Security gaps (Actuator exposure, no rate limiting) would concern Stripe engineers |
| **Eightfold** | YES | YES | YES | AI integration directly relevant |
| **Startup** | YES | YES | YES | Full-stack, deployed, AI — exactly what startups want |

---

## TOP 5 STRENGTHS

1. **Real AI Integration** — Gemini 2.5 Flash via raw HttpClient with prompt engineering, retry logic, schema reflection, and URL preservation. Not a toy demo.
2. **Dual OAuth2 + JWT** — Both Google and GitHub OAuth2 implemented and working alongside email/password login with proper token handling.
3. **Production Deployed** — Live on Vercel + Render + Neon with Docker containerization. Not just localhost.
4. **Feature Completeness** — 5 distinct dashboard views, 25+ API endpoints, pagination, search, deduplication, analytics with charts, PWA.
5. **Code Cleanliness** — Consistent N-tier separation, DTO pattern, Lombok, LAZY fetching — shows engineering discipline.

---

## TOP 5 WEAKNESSES

1. **Testing is nearly absent** — 2 smoke tests, 0 unit tests, 0 frontend tests. This is the single biggest red flag for mid/senior hiring.
2. **Critical Security Gaps** — Actuator fully public (exposes heapdump, env), JWT in localStorage (XSS risk), no rate limiting on auth endpoints.
3. **No Database Migration Tool** — schema.sql is a manual DDL file. Flyway/Liquibase is expected in production systems.
4. **Analytics Performance** — Stream-based aggregation of all records in Java instead of SQL GROUP BY. Will not scale.
5. **No CD Pipeline** — GitHub Actions only runs SonarQube (with -DskipTests). No automated deploy pipeline.

---

## SUGGESTED IMPROVEMENTS (Priority Order)

### Immediate (fixes before showing to any employer)
1. Restrict Actuator: `permitAll()` -> `.hasRole("ADMIN")` or limit to management port
2. Remove `DB_PASSWORD:Rohk_1265` default from application.yml
3. Change `ddl-auto: update` to `validate` in application-prod.yml
4. Add minimum rate limiting on `/api/auth/login`

### Short-term (before interview at FAANG)
5. Write 10+ unit tests: UserService, JwtTokenProvider, ApplicationService.normalizeUrl
6. Extract `normalizeUrl()` to `UrlUtils` (shows DRY awareness)
7. Replace stream analytics with SQL: `SELECT status, COUNT(*) FROM applications WHERE user_id = ? GROUP BY status`
8. Fix README API table — `/api/analytics/events` doesn't exist

### Long-term (portfolio polish)
9. Migrate schema.sql to Flyway
10. Add HttpOnly cookie JWT option (shows security maturity)
11. Wire EmailService to `@Scheduled` job (complete the notification feature)
12. Add CI test pipeline in GitHub Actions

---

## INTERVIEW SUITABILITY

This project generates excellent interview discussion across all rounds:

- **System Design:** Discuss scaling analytics from streams to SQL, caching JWT user lookup, pagination strategy
- **Security:** JWT storage trade-offs (localStorage vs cookies), OAuth2 flow, rate limiting approaches
- **Backend:** Spring Security filter chain, JPA relationships, DTO pattern rationale, Gemini integration
- **Frontend:** TanStack Query vs Redux, React.lazy() code splitting, PWA service workers, Axios interceptors
- **Database:** Index strategy, unique constraint design, why stream aggregation is a bottleneck
- **DevOps:** Docker multi-stage builds, why -DskipTests in CI is a problem, Render cold starts

---

## FINAL VERDICT

**Recommended for:** Entry-level (L3), Junior Mid-level (L4) roles at all companies.
**With testing improvements:** Mid-level (L4-L5) at Google, Amazon, Microsoft, Stripe.
**Overall impression:** This project genuinely stands out among student portfolios. The breadth (AI + OAuth + PWA + Analytics + Docker + 5 views) combined with architectural discipline (N-tier, DTO, LAZY fetching) signals a developer who has gone beyond tutorials and built something real. The security gaps and testing absence are fixable — but must be fixed.

**Would Hire For Junior Role:** YES
**Would Hire For Mid-Level Without Improvements:** NO (testing gap)
**Would Shortlist For Interview:** YES — at any company

---

*All scores and assessments are based exclusively on code found in the repository. No features were assumed. Every claim is traceable to a specific file and line number.*
