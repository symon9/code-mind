# Multi-stage Dockerfile for NestJS backend monorepo

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy monorepo manifests
COPY package.json package-lock.json turbo.json ./
COPY shared ./shared
COPY backend ./backend

# Install dependencies across workspaces
RUN npm ci

# Generate Prisma client for backend
WORKDIR /app/backend
RUN npx prisma generate

# Build backend production bundle
RUN npm run build

# Remove devDependencies for lean runtime
WORKDIR /app
RUN npm prune --production

# --- Stage 2: Production Runtime Stage ---
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules & source workspaces
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package*.json ./backend/

WORKDIR /app/backend

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && (node dist/src/main || node dist/main)"]
