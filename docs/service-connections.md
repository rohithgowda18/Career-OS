# Microservices Communication & Code Snippets: Career OS

This document details the communication patterns, data flow, and exact code implementations connecting the **Frontend**, **Auth Service**, **Career Service**, and **AI Extraction Service**.

---

## 1. Inter-Service Communication Flow

```
                      [ React Client (Vite :5173) ]
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
        (Auth / Profile)                          (Career Domain)
              ▼                                         ▼
   [ Auth Service :8081 ]                    [ Career Service :8080 ]
   (Issues & signs JWTs)                      (Verifies JWT locally)
              │                                         │
              ▼                                         ▼
   [(career_os_auth_db)]                                │ (Delegation via HTTP)
                                                        ▼
                                             [ AI Extraction Service :8082 ]
                                                        │
                                                        ▼
                                              [ Google Gemini API ]
```

---

## 2. Communication Patterns & Code Snippets

### A. Frontend Dynamic Routing Interceptor (`apps/web`)

The React frontend uses an Axios request interceptor in `restClient.ts` to transparently route requests to either Auth Service or Career Service:

```typescript
// apps/web/src/lib/restClient.ts
const normalizedUrl = getApiBaseUrl(); // http://localhost:8080
const normalizedAuthUrl = 'http://localhost:8081';

const restClient = axios.create({
  baseURL: normalizedUrl,
  timeout: 60000,
});

restClient.interceptors.request.use((config) => {
  // Route Auth and Profile endpoints to Auth Service (:8081)
  if (config.url && (
    config.url.startsWith('/api/auth') || 
    config.url.startsWith('/api/profile') || 
    config.url.startsWith('/login/oauth2')
  )) {
    config.baseURL = normalizedAuthUrl;
  }

  // Attach JWT Bearer Token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

---

### B. Auth Service: Token Generation (`apps/auth-service`)

When a user logs in, the Auth Service signs a JWT containing the user identity:

```java
// apps/auth-service/src/main/java/com/careeros/auth/security/JwtTokenProvider.java
public String generateToken(Long userId, String email) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

    return Jwts.builder()
            .setSubject(Long.toString(userId))
            .claim("userId", userId)
            .claim("email", email)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(key, SignatureAlgorithm.HS512)
            .compact();
}
```

---

### C. Career Service: Stateless Token Verification (`apps/backend`)

Career Service does not call Auth Service over the network. Instead, it verifies the signature locally and builds a `UserPrincipal`:

```java
// apps/backend/src/main/java/com/eventtracker/security/JwtAuthenticationFilter.java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
    String jwt = getJwtFromRequest(request);

    if (StringUtils.hasText(jwt)) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(jwt)
                .getPayload();

        Long userId = claims.get("userId", Long.class);
        String email = claims.get("email", String.class);

        UserPrincipal principal = new UserPrincipal(userId, email, Collections.emptyList());
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
    filterChain.doFilter(request, response);
}
```

---

### D. Decoupled Entities using `userId` (`apps/backend`)

Entities in Career Service reference the user using a plain identifier instead of a database join:

```java
// apps/backend/src/main/java/com/eventtracker/entity/Application.java
@Entity
@Table(name = "applications")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Decoupled: plain userId instead of @ManyToOne User user
    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String companyName;
    private String role;
    private String status;
}
```

---

### E. Career Service ──► AI Service OpenFeign Client (`apps/backend`)

Career Service uses **Spring Cloud OpenFeign** for declarative synchronous communication with the AI service:

```java
// apps/backend/src/main/java/com/eventtracker/client/AiExtractionClient.java
@FeignClient(
    name = "ai-extraction-service",
    url = "${AI_EXTRACTION_SERVICE_URL:${app.ai-extraction-service.url:http://localhost:8082}}",
    configuration = AiExtractionClientConfiguration.class
)
public interface AiExtractionClient {

    @PostMapping(value = "/api/extraction/classify", consumes = MediaType.APPLICATION_JSON_VALUE)
    Map<String, String> classify(@RequestBody ExtractionRequest request);

    @PostMapping(value = "/api/extraction/placement", consumes = MediaType.APPLICATION_JSON_VALUE)
    PlacementDTO extractPlacement(@RequestBody ExtractionRequest request);

    @PostMapping(value = "/api/extraction/application", consumes = MediaType.APPLICATION_JSON_VALUE)
    ApplicationDTO extractApplication(@RequestBody ExtractionRequest request);
}
```

Service Layer delegating to Feign Client:

```java
// apps/backend/src/main/java/com/eventtracker/service/GeminiExtractionService.java
@Service
@RequiredArgsConstructor
public class GeminiExtractionService {
    private final AiExtractionClient aiExtractionClient;

    public PlacementDTO extractPlacementDetails(String emailContent) {
        return aiExtractionClient.extractPlacement(new ExtractionRequest(emailContent));
    }

    public ApplicationDTO extractApplicationDetails(String emailContent) {
        return aiExtractionClient.extractApplication(new ExtractionRequest(emailContent));
    }

    public String classifyEmail(String emailContent) {
        Map<String, String> response = aiExtractionClient.classify(new ExtractionRequest(emailContent));
        return response != null ? response.getOrDefault("classification", "IRRELEVANT") : "IRRELEVANT";
    }
}
```

---

### F. AI Extraction Service Endpoint (`apps/ai-extraction-service`)

The AI service receives the payload and interacts with Gemini:

```java
// apps/ai-extraction-service/src/main/java/com/careeros/ai/controller/ExtractionController.java
@RestController
@RequestMapping("/api/ai")
public class ExtractionController {
    private final GeminiExtractionService geminiExtractionService;

    @PostMapping("/extract")
    public ResponseEntity<ExtractionResponse> extract(@RequestBody ExtractionRequest request) {
        ExtractionResponse response = geminiExtractionService.extractFromEmail(request.getEmailBody());
        return ResponseEntity.ok(response);
    }
}
```
