# Spring Boot REST API Quick Reference

## Base URL

```
http://localhost:3000/api
```

## Headers

```
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 🔐 Authentication Endpoints

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}

Response: 201 Created
{
  "token": "eyJhbGc...",
  "expiresIn": 86400000,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "bio": null,
    "profilePictureUrl": null,
    "isActive": true,
    "createdAt": "2024-04-14T10:30:00",
    "updatedAt": "2024-04-14T10:30:00"
  }
}
```

### Login User

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "token": "eyJhbGc...",
  "expiresIn": 86400000,
  "user": { ... }
}
```

### Get Current User

```http
GET /auth/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

### Logout

```http
POST /auth/logout
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Logout successful"
}
```

---

## 📋 Applications Endpoints

### List All Applications

```http
GET /applications
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "eventName": "TechConf 2024",
    "eventType": "Conference",
    "status": "Applied",
    "deadline": "2024-12-31T23:59:59",
    "notes": "Submitted abstract",
    "url": "https://techconf.com",
    "successScore": null,
    "isFavorite": false,
    "rejectionReason": null,
    "applicationLink": null,
    "tags": null,
    "createdAt": "2024-04-14T10:30:00",
    "updatedAt": "2024-04-14T10:30:00"
  },
  ...
]
```

### Get Single Application

```http
GET /applications/{id}
Authorization: Bearer {token}

Example: GET /applications/1

Response: 200 OK
{
  "id": 1,
  "eventName": "TechConf 2024",
  "eventType": "Conference",
  "status": "Applied",
  ...
}
```

### Create Application

```http
POST /applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventName": "TechConf 2024",
  "eventType": "Conference",
  "status": "Applied",
  "deadline": "2024-12-31T23:59:59",
  "notes": "Submitted abstract",
  "url": "https://techconf.com",
  "isFavorite": false
}

Response: 201 Created
{
  "id": 1,
  "eventName": "TechConf 2024",
  ...
}
```

### Update Application

```http
PUT /applications/{id}
Authorization: Bearer {token}
Content-Type: application/json

Example: PUT /applications/1

{
  "status": "Accepted",
  "notes": "Updated notes"
}

Response: 200 OK
{
  "id": 1,
  "eventName": "TechConf 2024",
  "status": "Accepted",
  ...
}
```

### Delete Application

```http
DELETE /applications/{id}
Authorization: Bearer {token}

Example: DELETE /applications/1

Response: 200 OK
{
  "message": "Application deleted successfully"
}
```

### Get Applications by Status

```http
GET /applications/status/{status}
Authorization: Bearer {token}

Valid statuses:
- Interested
- Applied
- UnderReview
- Accepted
- Rejected
- Withdrawn

Example: GET /applications/status/Applied

Response: 200 OK
[
  { application object }, ...
]
```

### Get Applications by Event Type

```http
GET /applications/type/{eventType}
Authorization: Bearer {token}

Valid event types:
- Hackathon
- Workshop
- Conference
- Other

Example: GET /applications/type/Conference

Response: 200 OK
[
  { application object }, ...
]
```

### Get Application Count

```http
GET /applications/stats/count
Authorization: Bearer {token}

Response: 200 OK
5
```

### Get Count by Status

```http
GET /applications/stats/count/status/{status}
Authorization: Bearer {token}

Example: GET /applications/stats/count/status/Accepted

Response: 200 OK
3
```

---

## 📊 Status Values

- **Interested** - Initial interest in event
- **Applied** - Application submitted
- **UnderReview** - Application under review
- **Accepted** - Application accepted
- **Rejected** - Application rejected
- **Withdrawn** - Application withdrawn

## 🏆 Event Types

- **Hackathon** - Coding competitions
- **Workshop** - Hands-on learning
- **Conference** - Tech conferences
- **Other** - Other event types

---

## 🔄 JavaScript/TypeScript Examples

### Using Fetch API

```typescript
const API_BASE = "http://localhost:3000/api";

// Register
async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
  return response.json();
}

// Login
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  localStorage.setItem("token", data.token);
  return data;
}

// Get current user
async function getCurrentUser() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

// List applications
async function listApplications() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/applications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

// Create application
async function createApplication(
  eventName: string,
  eventType: string,
  status: string
) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ eventName, eventType, status }),
  });
  return response.json();
}

// Update application
async function updateApplication(id: number, updates: Partial<ApplicationDTO>) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/applications/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  return response.json();
}

// Delete application
async function deleteApplication(id: number) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/applications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
```

### Using Axios

```typescript
import axios, { AxiosInstance } from "axios";

const API_BASE = "http://localhost:3000/api";
const api: AxiosInstance = axios.create({ baseURL: API_BASE });

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register
export async function register(data: RegisterRequest) {
  return api.post("/auth/register", data);
}

// Login
export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", response.data.token);
  return response.data;
}

// List applications
export function listApplications() {
  return api.get("/applications");
}

// Create application
export function createApplication(data: ApplicationDTO) {
  return api.post("/applications", data);
}

// Update application
export function updateApplication(id: number, data: Partial<ApplicationDTO>) {
  return api.put(`/applications/${id}`, data);
}

// Delete application
export function deleteApplication(id: number) {
  return api.delete(`/applications/${id}`);
}
```

---

## ⚠️ Error Responses

### 400 Bad Request

```json
{
  "message": "Invalid request"
}
```

### 401 Unauthorized

```json
{
  "message": "Invalid credentials"
}
```

### 404 Not Found

```json
{
  "message": "Application not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Internal server error"
}
```

---

## 🔑 Token Format

Tokens are JWT (JSON Web Token) and should be:

- Stored in localStorage or sessionStorage
- Sent in Authorization header as `Bearer {token}`
- Valid for 24 hours (86400000 ms)
- Refresh by logging in again

---

## 📱 CORS Configuration

If running on different port/domain:

```yaml
# application.yml
app:
  cors:
    allowed-origins: http://localhost:5173,http://localhost:3000,https://yourdomain.com
```

---

## 🧪 Testing with cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# List applications (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/applications \
  -H "Authorization: Bearer TOKEN"

# Create application
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "eventName": "TechConf 2024",
    "eventType": "Conference",
    "status": "Applied"
  }'
```

---

## 📖 Complete TypeScript Types

```typescript
interface ApplicationDTO {
  id?: number;
  eventName: string;
  eventType: "Hackathon" | "Workshop" | "Conference" | "Other";
  status:
    | "Interested"
    | "Applied"
    | "UnderReview"
    | "Accepted"
    | "Rejected"
    | "Withdrawn";
  deadline?: Date;
  notes?: string;
  url?: string;
  successScore?: number;
  isFavorite?: boolean;
  rejectionReason?: string;
  applicationLink?: string;
  tags?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserDTO {
  id?: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePictureUrl?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthResponse {
  token: string;
  expiresIn: number;
  user: UserDTO;
}
```

---

Last Updated: April 14, 2024
