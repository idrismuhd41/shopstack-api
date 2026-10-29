# ────────────────────────────────────────────────────────────
# Stage 1 — builder
# Installs all deps, generates Prisma client, compiles TS → JS.
# ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
# Copy package files before source — if only source changes,
# this layer is reused and `npm ci` doesn't re-run.
COPY package*.json ./
COPY prisma ./prisma

# Install ALL dependencies (including devDependencies for tsc)
RUN npm ci

# Generate Prisma Client — uses schema.prisma
RUN npx prisma generate

# Copy source code and TypeScript config
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript (outputs to dist/)
RUN npm run build

# ────────────────────────────────────────────────────────────
# Stage 2 — runner
# Copies only compiled JS + prod dependencies. No TS, no tests.
# ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production for performance
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
# Copy generated Prisma Client from builder stage
# (the client lives inside node_modules after generate)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy compiled JavaScript
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and migrations (needed for `prisma migrate deploy` at runtime)
COPY --from=builder /app/prisma ./prisma

# Run as non-root user (Docker best practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the API port (documentation; doesn't actually publish)
EXPOSE 3000

# Health check — Docker will mark container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start the compiled server
CMD ["node", "dist/server.js"]