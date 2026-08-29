# Multi-stage production build for AITOOLS Frontend
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy client source code
COPY . .

# Build argument for backend API URL (defaults to /api/v1 for reverse-proxy routing)
ARG REACT_APP_BASE_URL=/api/v1
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
ENV CI=false

RUN npm run build

# Stage 2: Minimal Nginx runtime
FROM nginx:1.25-alpine AS runner
WORKDIR /usr/share/nginx/html

# Clean default nginx files
RUN rm -rf ./*

# Copy compiled React static assets from builder stage
COPY --from=builder /app/build ./

# Copy Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
