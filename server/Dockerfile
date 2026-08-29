# Multi-stage minimal production image for AITOOLS Backend
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Run as non-root user for container security
USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/health || exit 1

CMD ["node", "index.js"]
