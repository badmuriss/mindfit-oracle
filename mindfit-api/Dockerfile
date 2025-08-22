# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Leverage Docker cache for dependencies
COPY pom.xml .
RUN mvn dependency:resolve

# Copy source and build
COPY src src
RUN mvn -q -DskipTests package

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=production
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

