# ==========================
# Stage 1: Base
# ==========================
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

# Install dependencies for testing and production
RUN npm ci

COPY . .

# ==========================
# Stage 2: Test (optional)
# ==========================
FROM base AS test

# Run tests
RUN NODE_OPTIONS=--experimental-vm-modules npm test

# ==========================
# Stage 3: Production
# ==========================
FROM node:20-alpine AS prod

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY src ./src

# Install curl, wget, bash for healthchecks
RUN apk add --no-cache curl wget bash

# Add non-root user with writable home
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /home/appuser \
    && chown -R appuser:appgroup /home/appuser /app

USER appuser

# Build-time metadata (from Jenkins)
ARG GIT_SHA
ARG BUILD_TIME
ENV GIT_SHA=${GIT_SHA}
ENV BUILD_TIME=${BUILD_TIME}

ENV NODE_ENV=production
ENV PORT=3000
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD /usr/bin/curl -fsS http://localhost:3000/healthz || exit 1

EXPOSE 3000

CMD ["node", "src/index.js"]

