# 🚪 Career OS API Gateway Architecture

> **Unified Ingress & Microservice Routing Layer**  
> Built with Spring Cloud Gateway & Netflix Eureka Service Discovery.

---

## 🏗️ Clean Microservice Port Allocation Table

| Service Name | Port | Eureka Service ID | Purpose |
| :--- | :--- | :--- | :--- |
| **API Gateway** | **`:8080`** | `api-gateway` | **Single Public Entry Point** for Frontend and Clients |
| **Auth Service** | **`:8081`** | `career-os-auth-service` | Authentication, JWT, Social OAuth2, User Profiles |
| **AI Extraction Service** | **`:8082`** | `ai-extraction-service` | Gemini LLM parsing of Job Descriptions & Offers |
| **Core Career Backend** | **`:8085`** | `career-os` | Job Applications, Timeline Events, Analytics |
| **Eureka Discovery Server** | **`:8761`** | `service-discovery` | Dynamic Service Registry & Heartbeat Engine |
| **Web Frontend (Vite)** | **`:5173`** | *(Client)* | React Single Page Application |

---

## 🔀 Route Configuration Matrix

```mermaid
flowchart TD
    Client["🌐 Web Frontend (:5173)"] -->|All Requests -> http://localhost:8080| Gateway["🚪 Spring Cloud API Gateway (:8080)"]

    subgraph ServiceMesh ["Internal Microservice Ecosystem"]
        Eureka["🧭 Eureka Service Discovery (:8761)"]
        AuthSrv["🔐 Auth Service (:8081)<br>(career-os-auth-service)"]
        AISrv["🤖 AI Extraction Service (:8082)<br>(ai-extraction-service)"]
        BackendSrv["💼 Core Backend (:8085)<br>(career-os)"]
    end

    Gateway -.->|Dynamic Route Lookup| Eureka
    Gateway -->|/api/auth/**, /api/profile/**, /oauth2/**| AuthSrv
    Gateway -->|/api/extraction/**| AISrv
    Gateway -->|/api/** (Applications, Events, Analytics)| BackendSrv
```

---

## 🛡️ Frontend Abstraction
The frontend `.env` configures only one single URL:
```properties
VITE_API_URL=http://localhost:8080
```
All routes (`/api/auth/login`, `/api/applications`, `/api/extraction/placement`) are routed dynamically by the API Gateway to the respective microservice instances discovered through Eureka.

---

## 🚀 Startup Order

1. **Eureka Server**: `cd apps/service-discovery && mvn spring-boot:run` *(Port 8761)*
2. **Auth Service**: `cd apps/auth-service && mvn spring-boot:run` *(Port 8081)*
3. **AI Service**: `cd apps/ai-extraction-service && mvn spring-boot:run` *(Port 8082)*
4. **Core Backend**: `cd apps/backend && mvn spring-boot:run` *(Port 8085)*
5. **API Gateway**: `cd apps/api-gateway && mvn spring-boot:run` *(Port 8080)*
6. **Web Frontend**: `cd apps/web && npm run dev` *(Port 5173)*
