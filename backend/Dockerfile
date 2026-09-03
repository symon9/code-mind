# Multi-stage Dockerfile for NestJS backend

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if required
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build production bundle
RUN npm run build

# Remove devDependencies to optimize production node_modules
RUN npm prune --production

# --- Stage 2: Production Runtime Stage ---
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
# Copy compiled application code
COPY --from=builder /app/dist ./dist
# Copy Prisma assets & migrations for runtime/migration capabilities
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
