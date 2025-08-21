# Build Angular app
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time API base URL for the frontend
ARG API_BASE_URL=http://localhost:8080
ENV API_BASE_URL=${API_BASE_URL}

# Overwrite production environment with provided API base
RUN node -e "const fs=require('fs');const api=process.env.API_BASE_URL||'http://localhost:8080';const content='export const environment = { production: true, apiBaseUrl: \\''+api+'\\', openApiUrl: \\''+api+'/api-docs\\' };\\n';fs.mkdirSync('src/environments',{recursive:true});fs.writeFileSync('src/environments/environment.prod.ts',content);"

RUN npm run build -- --configuration production

# Serve with Nginx
FROM nginx:alpine

# SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular v16+ default output path
COPY --from=build /app/dist/mindfit-admin-panel/browser /usr/share/nginx/html

EXPOSE 80

