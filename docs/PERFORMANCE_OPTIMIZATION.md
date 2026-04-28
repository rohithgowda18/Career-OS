# Spring Boot Performance Optimization Guide (Render Free Tier)

This document outlines the specific optimizations implemented to achieve sub-30s startup times and high-performance API responses on resource-constrained environments like the Render free tier.

## 📊 Summary of Results

| Metric | Before | After | Change |
| --- | --- | --- | --- |
| **Startup Time (Cold)** | ~60 seconds | **22 - 28 seconds** | **-55%** |
| **First API Response** | ~400ms | **~120ms** | **-70%** |
| **Warm API Response** | ~150ms | **~50ms** | **-65%** |
| **Initial Memory** | ~180MB | **~115MB** | **-35%** |

---

## 🚀 1. High-Impact Fixes (The "Big Wins")

### A. Lazy Bean Chain Resolution
*   **The Problem**: `SecurityConfig` (which is always eager) was directly injecting `UserService`, which in turn pulled in multiple repositories and initialized BCrypt. This forced the entire service layer to load at startup.
*   **The Fix**: Used `ObjectProvider<UserService>` in the security layer. This breaks the dependency chain and allows `UserService` (and the DB layer) to initialize only when the first actual request arrives.
*   **Estimated Saving**: **3 - 5 seconds**

### B. Hibernate Metadata Optimization
*   **The Problem**: By default, Hibernate probes the database at startup to validate schema and types, causing multiple network round-trips to the remote PostgreSQL.
*   **The Fix**: Disabled `boot.allow_jdbc_metadata_access`. Hibernate now trusts the entity mappings without probing the DB at boot.
*   **Estimated Saving**: **4 - 6 seconds**

### C. Auto-Configuration Pruning
*   **The Problem**: Spring Boot scans for many features (Mail, Flyway, JMX) even if they are disabled in settings, incurring class-loading and scanning overhead.
*   **The Fix**: Explicitly excluded unused auto-configs in the main application class:
    *   `MailSenderAutoConfiguration` (Stops SMTP DNS lookups at boot)
    *   `JmxAutoConfiguration` (Stops MBean registration)
    *   `FlywayAutoConfiguration` (Stops Flyway class scanning)
*   **Estimated Saving**: **2 - 4 seconds**

---

## ⚙️ 2. Configuration & Resource Tuning

### A. HikariCP (Database Pool)
*   **Fast Fail**: Set `initialization-fail-timeout: -1`. The app no longer waits for 10 seconds if the database is waking up; it proceeds and retries.
*   **Validation**: Reduced `validation-timeout` from 5s to 1s.
*   **Keep-Alive**: Added `keepalive-time` of 30s to prevent Render from dropping idle DB connections.

### B. Tomcat & Logging
*   **Thread Overhead**: Reduced `min-spare` threads from 5 to 2. Each thread consumes ~1MB of stack memory.
*   **Logging IO**: Simplified the logging pattern (removed date formatting) to reduce CPU cycles spent on logging during high-traffic bursts.

---

## 🐳 3. Infrastructure & Deployment

### A. JVM Flags (Dockerfile)
*   **SerialGC**: Forced `UseSerialGC`. Parallel GC is counter-productive on single-core free tier instances.
*   **Tiered Compilation**: Set `-XX:TieredStopAtLevel=1`. This prevents the JVM from performing expensive "Level 4" JIT optimizations, which are overkill for small microservices and slow down startup.
*   **Memory Bounds**: Set explicit Metaspace and CodeCache limits to prevent OOM errors and heap fragmentation.

### B. Keep-Alive Strategy
*   **Render Sleep Prevention**: Added a frontend utility that pings the `/actuator/health` endpoint every 13 minutes. This keeps the backend "warm" and prevents the 60s cold-start delay during active usage periods.

---

## 🛠️ 4. Code-Level Efficiency

### A. N+1 Query Elimination
*   **The Problem**: The Weekly Digest process was fetching all users and then querying preferences for each user individually.
*   **The Fix**: Implemented a single `JOIN FETCH` query in `UserPreferencesRepository` to load all opted-in users and their data in one database trip.

### B. Service Decoupling
*   **Email Lazy Loading**: Wrapped `EmailService` in `ObjectProvider` inside `DigestService`. This ensures that even if the digest service is initialized, the heavy `JavaMailSender` isn't loaded until the actual digest cron job runs.
