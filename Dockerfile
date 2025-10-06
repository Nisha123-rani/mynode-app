# ==========================
# Stage 1: Base dependencies
# ==========================
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

# Install all dependencies (for tests + prod)
RUN npm ci

COPY . .

# ==========================
# Stage 2: Test (optional)
# ==========================
FROM base AS test

# Run tests in build pipeline (optional)
# NOTE: This stage won’t run in prod unless you explicitly use it.
RUN NODE_OPTIONS=--experimental-vm-modules npm test

# ==========================
# Stage 3: Production
# ==========================
FROM node:20-alpine AS prod

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code from build
COPY src ./src

# Add non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Set environment variables
ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/index.js"]

