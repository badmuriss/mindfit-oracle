# Build React Native Web app
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build-time API base URL for the frontend
ARG API_BASE_URL=http://localhost:8088
ENV API_BASE_URL=${API_BASE_URL}

# Create app config with environment variable
RUN node -e "const fs = require('fs'); const config = JSON.parse(fs.readFileSync('app.json', 'utf8')); config.expo.extra.apiBaseUrl = process.env.API_BASE_URL; fs.writeFileSync('app.json', JSON.stringify(config, null, 2));"

# Build for web
RUN npm run build:web

# Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config for SPA/Multi-page export routing
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index home.html index.html; \
    \
    # Try the exact file, an .html variant, then fall back to home.html \
    location / { \
        try_files $uri $uri.html /home.html; \
    } \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
}' > /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
