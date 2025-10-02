# Mindfit API

Spring Boot service for the Mindfit platform, now backed by Oracle Database with PL/SQL intelligence and AI-assisted recommendations.

## Highlights
- User, meal, exercise, measurement and log management
- JWT authentication with role-based access control
- Chatbot and recommendation engine with rate limiting
- Oracle procedures/functions for analytics and alerts
- Swagger/OpenAPI docs included out of the box

## Stack
- Java 21 · Spring Boot 3.5
- Spring Data JPA (Hibernate) + Oracle XE
- MapStruct · Lombok · Bucket4j · Spring AI

## Local setup
1. **Start Docker services**
   ```bash
   docker compose up -d
   ```
   This brings up Oracle XE (1521), the API (8088), admin panel (8082) and web app (8083).

2. **Environment variables** (via `.env` or shell)
   ```properties
   SPRING_DATASOURCE_URL=jdbc:oracle:thin:@localhost:1521/FREE
   SPRING_DATASOURCE_USERNAME=mindfit
   SPRING_DATASOURCE_PASSWORD=senha
   JWT_SECRET=change-me
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Run the API**
   ```bash
   mvn spring-boot:run
   ```

4. **Useful endpoints**
   - Swagger UI: http://localhost:8088/swagger-ui.html
   - Health ready: http://localhost:8088/health/ready

## Oracle assets
Located under `src/main/resources/db/oracle`:

| File | Purpose |
| --- | --- |
| `schema.sql` | Creates tables, FKs and indexes (users, registers, sensors, logs...). |
| `seed-data.sql` | Demo data for users, meals, exercises, measurements, sensors. |
| `plsql/functions.sql` | `fn_calculate_bmi`, `fn_format_user_profile`. |
| `plsql/procedures.sql` | `sp_generate_user_consumption_report`, `sp_register_sensor_alert`. |

More details: `docs/oracle/README.md` (DER, execution order, sample queries).

## Stored procedure usage
- `ReportService` executes `sp_generate_user_consumption_report` via `SimpleJdbcCall`.
- Endpoint `GET /users/{id}/consumption-report` exposes totals consumed/burned/net.

## Key configuration excerpt
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:oracle:thin:@localhost:1521/FREE}
    username: ${SPRING_DATASOURCE_USERNAME:mindfit}
    password: ${SPRING_DATASOURCE_PASSWORD:senha}
    driver-class-name: oracle.jdbc.OracleDriver
  jpa:
    hibernate:
      ddl-auto: none
    open-in-view: false
    show-sql: false

app:
  jwt:
    secret: ${JWT_SECRET:change-me}
    expiration-ms: 86400000
```

## Development
```bash
mvn test
mvn clean package
```

## Useful links
- Oracle assets: `docs/oracle/README.md`
- Admin panel: http://localhost:8082
- Web app: http://localhost:8083

## License
MIT
