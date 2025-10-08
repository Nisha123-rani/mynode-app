# ==========================
# Stage 3: Production
# ==========================
FROM node:20-alpine AS prod

WORKDIR /app

# Copy only dependency manifests and install production deps
COPY package*.json ./
RUN npm ci --only=production

# Install curl for healthchecks and in-container verification
RUN apk add --no-cache curl

# Copy source code
COPY src ./src

# --------------------------
# Build-time metadata
# --------------------------
ARG GIT_SHA
ARG BUILD_TIME

# --------------------------
# Labels for image metadata
# --------------------------
LABEL maintainer="nisha"
LABEL git_commit="${GIT_SHA}"
LABEL build_time="${BUILD_TIME}"

# --------------------------
# Environment variables
# --------------------------
ENV NODE_ENV=production
ENV PORT=3000
ENV GIT_SHA=${GIT_SHA}
ENV BUILD_TIME=${BUILD_TIME}

# --------------------------
# Security: Non-root user
# --------------------------
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# --------------------------
# Healthcheck using curl
# --------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3000/healthz || exit 1

# --------------------------
# Expose port and start app
# --------------------------
EXPOSE 3000
CMD ["node", "src/index.js"]

