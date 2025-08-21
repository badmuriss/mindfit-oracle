# Mindfit API

A Spring Boot + MongoDB backend for a fitness/diet tracking system with JWT authentication, role-based access control, and AI chatbot integration.

## Features

- **Authentication & Authorization**: JWT-based auth with USER and ADMIN roles
- **CRUD Operations**: Full CRUD for users, meals, exercises, measurements, and logs
- **Role-Based Access Control**: Users can only access their own data, admins can access everything
- **Pagination**: All GET endpoints return paginated results
- **Rate Limiting**: Chatbot endpoint is rate-limited (20 requests/min per user)
- **API Documentation**: Swagger/OpenAPI integration
- **AI Integration**: OpenAI-powered chatbot
- **Data Validation**: Comprehensive input validation
- **Global Exception Handling**: Consistent error responses

## Tech Stack

- **Java 21**
- **Spring Boot 3.5.4**
- **MongoDB** with Spring Data
- **JWT** authentication
- **MapStruct** for DTO mapping
- **Bucket4j** for rate limiting
- **Swagger/OpenAPI** for documentation
- **Spring AI** for OpenAI integration

## Quick Start

### Prerequisites

- Java 21+
- Docker & Docker Compose
- Maven

### 1. Start MongoDB

```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Mongo Express on port 8081 (admin/admin)

### 2. Set Environment Variables

Create a `.env` file in the project root:

```properties
MONGO_URI=mongodb://localhost:27017/mindfit
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

The API is available at `http://localhost:8080/` by default.

### 4. Access API Documentation

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API Docs: `http://localhost:8080/api-docs`

## API Endpoints

### Authentication
- `POST /auth/user/login` - User login
- `POST /auth/user/signup` - User signup
- `POST /auth/admin/login` - Admin login
- `POST /auth/admin/signup` - Admin signup (requires SUPER_ADMIN)

### Users (Admin only for creation, users can manage their own)
- `GET /users` - List all users (Admin only)
- `GET /users/{id}` - Get user by ID
- `POST /users` - Create user (Admin only)
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Meal Registers
- `GET /users/{userId}/meals` - List user's meals
- `GET /users/{userId}/meals/{id}` - Get meal by ID
- `POST /users/{userId}/meals` - Create meal
- `PUT /users/{userId}/meals/{id}` - Update meal
- `DELETE /users/{userId}/meals/{id}` - Delete meal

### Exercise Registers
- `GET /users/{userId}/exercises` - List user's exercises
- `GET /users/{userId}/exercises/{id}` - Get exercise by ID
- `POST /users/{userId}/exercises` - Create exercise
- `PUT /users/{userId}/exercises/{id}` - Update exercise
- `DELETE /users/{userId}/exercises/{id}` - Delete exercise

### Measurements Registers
- `GET /users/{userId}/measurements` - List user's measurements
- `GET /users/{userId}/measurements/{id}` - Get measurement by ID
- `POST /users/{userId}/measurements` - Create measurement
- `PUT /users/{userId}/measurements/{id}` - Update measurement
- `DELETE /users/{userId}/measurements/{id}` - Delete measurement

### Logs (Admin only)
- `GET /logs` - List all logs
  - Optional filters: `startDate`, `endDate` as `YYYY-MM-DD`, `type` (ERROR|WARNING|INFO), `category` (string)
- `GET /logs/{id}` - Get log by ID
- `POST /logs` - Create log

### Chatbot (Rate limited: 20 req/min)
- `POST /users/{userId}/chatbot` - Chat with AI assistant
- `DELETE /users/{userId}/chatbot/history` - Clear chatbot history

## Authentication

All endpoints except `/auth/**` require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Data Models

### User
- `id`, `email`, `passwordHash`, `roles`, `createdAt`

### MealRegister
- `id`, `userId`, `name`, `timestamp`, `calories`, `createdAt`

### ExerciseRegister
- `id`, `userId`, `name`, `description`, `timestamp`, `duration`, `caloriesBurnt`, `createdAt`

### MeasurementsRegister
- `id`, `userId`, `weight`, `height`, `timestamp`, `createdAt`

### Log
- `id`, `type`, `category`, `name`, `stackTrace`, `timestamp`

## Pagination

All GET endpoints support pagination with query parameters:
- `page` (default: 0)
- `size` (default: 20)

Response format:
```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "total": 100
}
```

## Error Handling

All errors return a consistent format:
```json
{
  "message": "Error description",
  "error": "ERROR_CODE",
  "status": 400,
  "path": "/api/v1/endpoint",
  "timestamp": "2023-01-01T12:00:00"
}
```

## Development

### Running Tests
```bash
mvn test
```

### Building for Production
```bash
mvn clean package
```

### Docker Build
```bash
docker build -t mindfit-api .
```

## Configuration

Key configuration properties in `application.yml`:

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGO_URI:mongodb://localhost:27017/mindfit}
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}

app:
  jwt:
    secret: ${JWT_SECRET:mySecretKey}
    expiration-ms: 86400000  # 24 hours
```

## License

MIT License
