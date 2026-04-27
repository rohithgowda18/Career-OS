# Event App Tracker - Spring Boot Backend

A Spring Boot REST API backend for the Event Application Tracker application. This backend handles authentication, application management, user profiles, and recommendations.

## Technology Stack

- **Java 17+**
- **Spring Boot 3.2.3**
- **PostgreSQL Database**
- **Spring Security + JWT**
- **Spring Data JPA**
- **Maven**
- **Flyway for Database Migrations**

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/eventtracker/
│   │   │   ├── EventAppTrackerApplication.java    (Main application)
│   │   │   ├── controller/                        (REST Controllers)
│   │   │   │   ├── AuthController.java
│   │   │   │   └── ApplicationController.java
│   │   │   ├── service/                           (Business Logic)
│   │   │   │   ├── UserService.java
│   │   │   │   └── ApplicationService.java
│   │   │   ├── entity/                            (JPA Entities)
│   │   │   │   ├── User.java
│   │   │   │   ├── Application.java
│   │   │   │   ├── UserProfile.java
│   │   │   │   └── UserPreferences.java
│   │   │   ├── repository/                        (JPA Repositories)
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── ApplicationRepository.java
│   │   │   │   ├── UserProfileRepository.java
│   │   │   │   └── UserPreferencesRepository.java
│   │   │   ├── dto/                               (Data Transfer Objects)
│   │   │   │   ├── UserDTO.java
│   │   │   │   ├── ApplicationDTO.java
│   │   │   │   └── AuthDTO.java
│   │   │   ├── security/                          (Security Configuration)
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── SecurityConfig.java
│   │   │   └── exception/                         (Exception Handlers)
│   │   └── resources/
│   │       ├── application.yml                    (Application Configuration)
│   │       ├── application-dev.yml                (Development Profile)
│   │       ├── application-prod.yml               (Production Profile)
│   │       └── db/migration/                      (Database Migrations)
│   │           └── V1__Initial_schema.sql
│   └── test/                                      (Unit Tests)
├── pom.xml                                        (Maven Configuration)
├── .env.example                                   (Environment Variables Template)
└── README.md                                      (This file)
```

## Prerequisites

- **Java 17+**: [Download from Oracle](https://www.oracle.com/java/technologies/downloads/#java17)
- **Maven 3.8+**: [Download Maven](https://maven.apache.org/download.cgi)
- **PostgreSQL 13+**: [Download PostgreSQL](https://www.postgresql.org/download/)

## Setup Instructions

### 1. Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE event_tracker_db;
CREATE USER event_tracker WITH PASSWORD 'password';
ALTER ROLE event_tracker SET client_encoding TO 'utf8';
ALTER ROLE event_tracker SET default_transaction_isolation TO 'read committed';
ALTER ROLE event_tracker SET default_transaction_deferrable TO on;
ALTER ROLE event_tracker SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE event_tracker_db TO event_tracker;
\q
```

### 2. Clone and Configure

```bash
cd backend

# Copy and configure environment variables
cp .env.example .env

# Edit .env with your configuration
# Minimum required:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=event_tracker_db
# DB_USER=postgres
# DB_PASSWORD=postgres
# JWT_SECRET=your-secret-key
```

### 3. Build the Project

```bash
# Build with Maven
mvn clean install

# Or skip tests for faster build
mvn clean install -DskipTests
```

### 4. Run the Application

```bash
# Development mode (with hot reload)
mvn spring-boot:run

# Production mode
java -jar target/event-app-tracker-1.0.0.jar
```

The server will start at `http://localhost:3000/api`

## API Documentation

### Authentication Endpoints

#### Register

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe"
}

Response:
{
  "token": "eyJhbGc...",
  "expiresIn": 86400000,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>
```

### Application Endpoints

#### List Applications

```
GET /api/applications
Authorization: Bearer <token>
```

#### Get Application

```
GET /api/applications/{id}
Authorization: Bearer <token>
```

#### Create Application

```
POST /api/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventName": "TechConf 2024",
  "eventType": "Conference",
  "status": "Applied",
  "deadline": "2024-12-31T23:59:59",
  "notes": "Submitted abstract",
  "url": "https://techconf.com"
}
```

#### Update Application

```
PUT /api/applications/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Accepted",
  "notes": "Updated notes"
}
```

#### Delete Application

```
DELETE /api/applications/{id}
Authorization: Bearer <token>
```

#### Get Applications by Status

```
GET /api/applications/status/{status}
Authorization: Bearer <token>

Status values: Interested, Applied, UnderReview, Accepted, Rejected, Withdrawn
```

#### Get Applications by Event Type

```
GET /api/applications/type/{eventType}
Authorization: Bearer <token>

EventType values: Hackathon, Workshop, Conference, Other
```

## Configuration

### application.yml

Key configuration properties:

```yaml
# Server
server.port: 3000
server.servlet.context-path: /api

# Database
spring.datasource.url: jdbc:postgresql://localhost:5432/event_tracker_db
spring.datasource.username: postgres
spring.datasource.password: postgres

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto: validate
spring.jpa.show-sql: false

# JWT
app.jwt.secret: your-secret-key
app.jwt.expiration: 86400000 # 24 hours in milliseconds

# CORS
app.cors.allowed-origins: http://localhost:5173,http://localhost:3000
```

### Profiles

- **dev**: Development profile with detailed logging
- **prod**: Production profile with optimized settings
- **test**: Test profile for integration tests

Run with specific profile:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

## Database Migrations

Migrations are managed by Flyway and automatically applied on startup:

- Location: `src/main/resources/db/migration/`
- Naming convention: `V{version}__{description}.sql`

To create a new migration:

```bash
# Create new migration file
touch src/main/resources/db/migration/V2__Add_new_feature.sql

# Add your SQL statements
# Restart the application to apply migration
```

## Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=AuthControllerTest

# Run with coverage
mvn clean test jacoco:report
```

## Building for Production

### Docker Build

```bash
# Build Docker image
docker build -t event-tracker-backend:1.0 .

# Run container
docker run -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_USER=postgres \
  -e DB_PASSWORD=password \
  -e JWT_SECRET=your-secret \
  event-tracker-backend:1.0
```

### JAR Build

```bash
# Build fat JAR
mvn clean package -DskipTests

# Run JAR
java -jar target/event-app-tracker-1.0.0.jar
```

## Troubleshooting

### Database Connection Error

- Ensure PostgreSQL is running
- Check DB credentials in .env or application.yml
- Verify database exists: `psql -l`

### JWT Token Issues

- Ensure JWT_SECRET is set in environment
- Check token expiration time
- Verify Authorization header format: `Bearer <token>`

### CORS Issues

- Check `app.cors.allowed-origins` matches your frontend URL
- Ensure requests include proper Origin header
- Check browser console for CORS errors

## Development Workflow

1. **Create Entity** → Define JPA entity in `entity/`
2. **Create Repository** → Define query methods in `repository/`
3. **Create DTO** → Define data transfer object in `dto/`
4. **Create Service** → Implement business logic in `service/`
5. **Create Controller** → Expose REST endpoints in `controller/`
6. **Write Tests** → Add unit/integration tests
7. **Create Migration** → Add database schema changes

## Security Considerations

- Passwords are hashed with BCrypt
- JWT tokens expire after 24 hours
- CORS is configured for specific origins
- CSRF protection is disabled for REST API (use CORS instead)
- All sensitive endpoints require authentication
- Implement rate limiting in production
- Use HTTPS in production

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

## Deployment Guides

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for:

- Heroku deployment
- AWS deployment
- Digital Ocean deployment
- Docker deployment

## Support

For issues and questions:

- Check [troubleshooting section](#troubleshooting)
- Review Spring Boot documentation
- Create an issue in the repository

## License

MIT License - See LICENSE file for details
