# MindFit - Complete Fitness Management Platform

A comprehensive full-stack fitness management platform with AI-powered features, built with Spring Boot, Angular, and MongoDB.

## 🌟 Features

### Core Functionality
- **User Management**: Complete user registration, authentication, and profile management
- **Meal Tracking**: Log and track daily meals with detailed nutritional information
- **Exercise Tracking**: Record workouts, exercises, and fitness activities
- **Body Measurements**: Track weight, body composition, and other health metrics
- **Activity Logging**: Comprehensive logging system for all user activities

### AI-Powered Features
- **Smart Chatbot**: OpenAI-powered assistant for fitness and nutrition guidance
- **Profile Generation**: AI-generated personalized fitness profiles based on user data
- **Intelligent Recommendations**: AI-driven meal and exercise suggestions

### Admin Panel
- **User Management**: View, create, edit, and delete user accounts
- **Data Analytics**: Comprehensive dashboard with charts and statistics
- **System Logs**: Monitor application activities and user actions
- **Content Management**: Manage system-wide content and settings

## 🏗 Architecture

### Backend (Spring Boot API)
- **Framework**: Spring Boot 3.5.4 with Java 21
- **Database**: MongoDB with Spring Data
- **Security**: JWT-based authentication with role-based access control
- **AI Integration**: OpenAI GPT integration for intelligent features
- **API Documentation**: Swagger/OpenAPI 3.0
- **Rate Limiting**: Built-in rate limiting for API protection

### Frontend (Angular Admin Panel)
- **Framework**: Angular 20 with standalone components
- **UI Library**: Angular Material + TailwindCSS
- **State Management**: Reactive forms and services
- **Charts**: Chart.js integration for data visualization
- **Authentication**: JWT-based auth with route guards

### Infrastructure
- **Database**: MongoDB 7.0 with authentication
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx for frontend serving
- **Development**: Hot reload support for both frontend and backend

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd mindfit-project
```

### 2. Environment Configuration (Optional)
Create a `.env` file in the root directory to customize settings:

```env
# Database Configuration
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=password
MONGO_INITDB_DATABASE=mindfit
MONGO_URI=mongodb://root:password@mongo:27017/mindfit?authSource=admin

# JWT Configuration
JWT_SECRET=mySecretKeyForDevelopmentPleaseChangeInProduction123456789012345678901234567890

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# CORS Configuration
APP_CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:4200

# Admin Panel Configuration
API_BASE_URL=http://localhost:8080
```

### 3. Start the Application
```bash
docker-compose up --build
```

This will start all services:
- **MongoDB**: Database server (internal port 27017)
- **API**: Spring Boot backend (http://localhost:8080)
- **Admin Panel**: Angular frontend (http://localhost:8081)

### 4. Access the Application

#### Admin Panel
- **URL**: http://localhost:8081
- **Default Admin Credentials**:
  - Email: `admin@example.com`
  - Password: `password`

#### API Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/api-docs

## 🔐 Default Admin Account

The system automatically creates a super admin account on first startup:

- **Email**: admin@example.com
- **Password**: password
- **Role**: SUPER_ADMIN

**⚠️ Important**: Change the default password after first login for security.

## 📱 API Endpoints

### Authentication
- `POST /auth/admin/login` - Admin login
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### User Management
- `GET /users` - List all users (Admin only)
- `GET /users/{id}` - Get user details
- `POST /users` - Create user (Admin only)
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Meal Tracking
- `GET /meals` - Get user meals
- `POST /meals` - Log new meal
- `PUT /meals/{id}` - Update meal
- `DELETE /meals/{id}` - Delete meal

### Exercise Tracking
- `GET /exercises` - Get user exercises
- `POST /exercises` - Log new exercise
- `PUT /exercises/{id}` - Update exercise
- `DELETE /exercises/{id}` - Delete exercise

### Measurements
- `GET /measurements` - Get user measurements
- `POST /measurements` - Log new measurement
- `PUT /measurements/{id}` - Update measurement
- `DELETE /measurements/{id}` - Delete measurement

### AI Features
- `POST /chatbot/chat` - Chat with AI assistant
- `POST /profile/generate` - Generate AI profile

### Logging
- `GET /logs` - Get system logs (Admin only)
- `POST /logs` - Create log entry

## 🔧 Development

### Backend Development
```bash
cd mindfit-api
./mvnw spring-boot:run
```

The API will be available at http://localhost:8080

### Frontend Development
```bash
cd mindfit-admin-panel
npm install
npm start
```

The admin panel will be available at http://localhost:4200

### Database Access
```bash
# Connect to MongoDB container
docker exec -it mindfit-mongo mongosh

# Authenticate
use admin
db.auth("root", "password")

# Switch to application database
use mindfit

# View collections
show collections
```

## 🛠 Configuration

### Environment Variables

#### API Configuration
- `SPRING_PROFILES_ACTIVE`: Set to `production` for production deployment
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `APP_CORS_ALLOWED_ORIGINS`: Allowed CORS origins

#### Admin Panel Configuration
- `API_BASE_URL`: Base URL of the API backend

### Application Properties
The API uses different configurations for development and production profiles:

- **Development**: `src/main/resources/application.yml`
- **Production**: Environment variables override defaults

## 📊 Data Models

### User
```json
{
  "id": "string",
  "email": "string",
  "password": "string (hashed)",
  "roles": ["USER", "ADMIN", "SUPER_ADMIN"],
  "profile": "string",
  "lastLogonDate": "datetime",
  "createdAt": "datetime",
  "enabled": "boolean"
}
```

### Meal Register
```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "description": "string",
  "calories": "number",
  "protein": "number",
  "carbs": "number",
  "fat": "number",
  "date": "datetime"
}
```

### Exercise Register
```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "description": "string",
  "duration": "number",
  "calories": "number",
  "date": "datetime"
}
```

### Measurements Register
```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "value": "number",
  "unit": "string",
  "date": "datetime"
}
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: USER, ADMIN, SUPER_ADMIN roles
- **Password Encryption**: BCrypt password hashing
- **CORS Protection**: Configurable CORS settings
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Standard security headers applied

## 🚀 Deployment

### Docker Deployment
The application is containerized and can be deployed using Docker Compose:

```bash
# Production deployment
docker-compose up -d --build
```

### Environment-Specific Deployments
- Update environment variables in `docker-compose.yml`
- Configure external MongoDB if needed
- Set up proper SSL certificates for production
- Configure external API keys (OpenAI, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

#### MongoDB Connection Issues
```bash
# Check MongoDB container logs
docker logs mindfit-mongo

# Verify MongoDB is running
docker ps | grep mongo
```

#### API Startup Issues
```bash
# Check API container logs
docker logs mindfit-api

# Verify environment variables
docker exec mindfit-api env | grep -E "(MONGO_URI|JWT_SECRET|OPENAI_API_KEY)"
```

#### Frontend Build Issues
```bash
# Check admin panel container logs
docker logs mindfit-admin-panel

# Rebuild frontend container
docker-compose up --build mindfit-admin-panel
```

#### Authentication Issues
- Verify JWT_SECRET is set and consistent
- Check that the super admin user was created successfully
- Ensure API and frontend are using the same base URL

### Logs and Monitoring
- API logs: `docker logs mindfit-api`
- Database logs: `docker logs mindfit-mongo`
- Frontend logs: `docker logs mindfit-admin-panel`
- System logs available through the admin panel at `/logs`

## 📞 Support

For support and questions:
1. Check the troubleshooting section above
2. Review the API documentation at http://localhost:8080/swagger-ui.html
3. Check application logs for error details
4. Create an issue in the repository for bugs or feature requests

---

**MindFit** - Empowering your fitness journey with intelligent technology! 💪🧠