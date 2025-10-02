# MindFit - Complete Fitness Management Platform

A comprehensive full-stack fitness management platform with AI-powered features, built with Spring Boot, Angular, Expo/React Native Web, and Oracle Database.

## 🌟 Features

### Core Functionality
- **User Management**: Complete user registration, authentication, and profile management
- **USDA Food Database**: Search and track meals using real food data from USDA with intelligent caching and rate limiting
- **Exercise Tracking**: Record workouts, exercises, and custom fitness activities with calorie estimation
- **Weight Tracking**: Visual weight tracking with custom SVG charts
- **AI Assistant**: OpenAI-powered chatbot for fitness and nutrition guidance

### AI-Powered Features
- **Smart Chatbot**: OpenAI-powered assistant for fitness and nutrition guidance
- **Profile Generation**: AI-generated personalized fitness profiles based on user data
- **Intelligent Recommendations**: AI-driven meal and exercise suggestions

### Admin Panel
- **User Management**: View, create, edit, and delete user accounts with age and sex fields
- **Data Analytics**: Comprehensive dashboard with user statistics
- **System Logs**: Monitor application activities and user actions
- **Content Management**: Manage system-wide content and settings

## 🏗 Architecture

### Backend (Spring Boot API)
- **Framework**: Spring Boot 3.5.4 with Java 21
- **Database**: Oracle Database XE with Spring Data JPA
- **Security**: JWT-based authentication with role-based access control
- **AI Integration**: OpenAI GPT integration for intelligent features
- **API Documentation**: Swagger/OpenAPI 3.0
- **Rate Limiting**: Built-in rate limiting for API protection

### Frontend
- **Admin Panel (Angular 20)**: Manage users, data, and system settings
- **App (Expo/React Native Web)**: End-user experience with USDA food database integration, custom weight charts, and AI assistant
- **Framework**: Angular 20 with standalone components
- **UI Library**: Angular Material + TailwindCSS for admin panel, React Native Paper for mobile app
- **State Management**: Reactive forms and services
- **Charts**: Custom SVG-based weight tracking charts
- **Food Data**: USDA Food Data Central API integration with intelligent caching
- **Authentication**: JWT-based auth with route guards

### Infrastructure
- **Database**: Oracle Database XE 21c
- **Containerization**: Docker & Docker Compose (optional)
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
SPRING_DATASOURCE_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1
SPRING_DATASOURCE_USERNAME=mindfit
SPRING_DATASOURCE_PASSWORD=mindfit

# JWT Configuration
JWT_SECRET=mySecretKeyForDevelopmentPleaseChangeInProduction123456789012345678901234567890

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# CORS Configuration
APP_CORS_ALLOWED_ORIGINS=http://localhost:8082,http://localhost:8083,http://localhost:4200

# Frontend/API Configuration
API_BASE_URL=http://localhost:8088

# USDA Food Data Central API Key (get free key from https://fdc.nal.usda.gov/)
USDA_API_KEY=DEMO_KEY
```

### 3. Start the Application
```bash
docker-compose up --build
```

If you prefer Docker, adjust the provided compose file to point at an external Oracle XE instance. By default we run the backend against a locally installed Oracle XE and start the frontends separately:
- **API**: Spring Boot backend (http://localhost:8088)
- **Admin Panel**: Angular frontend (http://localhost:8082)
- **App (Web)**: Expo/React Native Web (http://localhost:8083)

### 4. Access the Application

#### Admin Panel
- **URL**: http://localhost:8082
- **Default Admin Credentials**:
  - Email: `admin@example.com`
  - Password: `password`

#### API Documentation
- **Swagger UI**: http://localhost:8088/swagger-ui.html
- **API Docs**: http://localhost:8088/api-docs

#### App (Web)
- **URL**: http://localhost:8083

## 🔐 Default Admin Account

The system automatically creates a super admin account on first startup:

- **Email**: admin@example.com
- **Password**: password
- **Role**: SUPER_ADMIN

**⚠️ Important**: Change the default password after first login for security.

## 📱 API Endpoints

### Authentication
- `POST /auth/user/login` - User login
- `POST /auth/user/signup` - User registration
- `POST /auth/admin/login` - Admin login
- `POST /auth/admin/signup` - Admin registration (SUPER_ADMIN only)

### User Management
- `GET /users` - List all users (Admin only)
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user
- `POST /users/{id}/generate-profile` - Generate profile for a user (AI)

### Meal Tracking (scoped to user)
- `GET /users/{userId}/meals` - List meals (optional date range, pagination)
- `GET /users/{userId}/meals/{id}` - Get meal by ID
- `POST /users/{userId}/meals` - Create new meal
- `PUT /users/{userId}/meals/{id}` - Update meal
- `DELETE /users/{userId}/meals/{id}` - Delete meal

### Exercise Tracking (scoped to user)
- `GET /users/{userId}/exercises` - List exercises (optional date range, pagination)
- `GET /users/{userId}/exercises/{id}` - Get exercise by ID
- `POST /users/{userId}/exercises` - Create new exercise
- `PUT /users/{userId}/exercises/{id}` - Update exercise
- `DELETE /users/{userId}/exercises/{id}` - Delete exercise

### Measurements (scoped to user)
- `GET /users/{userId}/measurements` - List measurements (optional date range, pagination)
- `GET /users/{userId}/measurements/{id}` - Get measurement by ID
- `POST /users/{userId}/measurements` - Create new measurement
- `PUT /users/{userId}/measurements/{id}` - Update measurement
- `DELETE /users/{userId}/measurements/{id}` - Delete measurement

### AI Features
- `POST /users/{userId}/chatbot` - Chat with AI assistant
- `DELETE /users/{userId}/chatbot/history` - Clear chatbot history

### Logging
- `GET /logs` - Get system logs (Admin only)
- `POST /logs` - Create log entry

## 🔧 Development

### Backend Development
```bash
cd mindfit-api
./mvnw spring-boot:run
```

The API will be available at http://localhost:8088

### Frontend Development
```bash
cd mindfit-admin-panel
npm install
npm start
```

The admin panel will be available at http://localhost:4200

### App (Web) Development
If you want to run the Expo app locally for web:
```bash
cd mindfit-app
npm install
npm run web
```

The app (web) will be available at http://localhost:19006 by default (Expo dev server), or use `docker compose` for the production-like build at http://localhost:8083.

### Database Access
```bash
# Abrir um shell SQL dentro do container Oracle
docker exec -it mindfit-oracle sqlplus mindfit/mindfit@//localhost:1521/FREE

# Alternativa usando SQLcl instalado localmente
sqlcl mindfit/mindfit@//localhost:1521/FREE

# Listar tabelas criadas pelos scripts
SELECT table_name FROM user_tables ORDER BY table_name;

# Executar funções/procedures de exemplo
SELECT fn_calculate_bmi('11111111-1111-1111-1111-111111111111') FROM dual;
CALL sp_generate_user_consumption_report('11111111-1111-1111-1111-111111111111', :total, :burned, :net);
```

## 🛠 Configuration

### Environment Variables

#### API Configuration
- `SPRING_PROFILES_ACTIVE`: Set to `production` for production deployment
- `SPRING_DATASOURCE_URL`: Oracle JDBC connection string
- `SPRING_DATASOURCE_USERNAME`: Oracle database user
- `SPRING_DATASOURCE_PASSWORD`: Oracle database password
- `JWT_SECRET`: Secret key for JWT token generation
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `APP_CORS_ALLOWED_ORIGINS`: Allowed CORS origins
- `LOGS_BASIC_USERNAME`: Username for Basic auth on `/logs` endpoints
- `LOGS_BASIC_PASSWORD`: Password for Basic auth on `/logs` endpoints

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
- Configure Oracle connection strings/credentials conforme o ambiente (dev/stage/prod)
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

#### Oracle Connection Issues
```bash
# Verificar logs do container Oracle
docker logs mindfit-oracle

# Validar se a porta está exposta
docker exec mindfit-oracle lsnrctl status

# Testar conexão usando sqlplus dentro do container
docker exec -it mindfit-oracle sqlplus mindfit/mindfit@//localhost:1521/FREE
```

#### API Startup Issues
```bash
# Check API container logs
docker logs mindfit-api

# Verify environment variables
docker exec mindfit-api env | grep -E "(SPRING_DATASOURCE_URL|JWT_SECRET|OPENAI_API_KEY)"
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
- Database logs: `docker logs mindfit-oracle`
- Frontend logs: `docker logs mindfit-admin-panel`
- System logs available através do painel administrativo em `/logs`

## 📞 Support

For support and questions:
1. Check the troubleshooting section above
2. Review the API documentation at http://localhost:8088/swagger-ui.html
3. Check application logs for error details
4. Create an issue in the repository for bugs or feature requests

---

**MindFit** - Empowering your fitness journey with intelligent technology! 💪🧠
