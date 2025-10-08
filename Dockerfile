# ==========================
# Stage 3: Production
# ==========================
FROM node:20-alpine AS prod

WORKDIR /app

# Copy only dependency manifests and install production deps
COPY package*.json ./
RUN npm ci --only=production

# --------------------------
# Install curl, wget, bash
# --------------------------
# Install as root (default) so binaries are accessible to non-root
RUN apk add --no-cache curl wget bash

# Copy source code
COPY src ./src

# --------------------------
# Build-time metadata
# --------------------------
ARG GIT_SHA
ARG BUILD_TIME

# Labels
LABEL maintainer="nisha"
LABEL git_commit="${GIT_SHA}"
LABEL build_time="${BUILD_TIME}"

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV GIT_SHA=${GIT_SHA}
ENV BUILD_TIME=${BUILD_TIME}
# Ensure PATH includes standard binaries
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH

# --------------------------
# Create non-root user with writable home
# --------------------------
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /home/appuser \
    && chown -R appuser:appgroup /home/appuser /app

# Switch to non-root user
USER appuser

# --------------------------
# Healthcheck using curl
# --------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3000/healthz || exit 1

# Expose port and start app
EXPOSE 3000
CMD ["node", "src/index.js"]

