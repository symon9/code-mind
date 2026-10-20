---
name: backend-ops
description: Operations guide for managing database migrations, inspecting serverless Neon PostgreSQL pools, probing live health status, and maintaining Render deployments for CodeMind.
---

# Backend Operations Skill

This skill documents operations and troubleshooting workflows for the cloud backend service.

## Core Services
- **Hosting**: Render Web Service (Docker runtime)
- **Primary URL**: `https://code-mind-k63e.onrender.com`
- **Database**: Neon.tech PostgreSQL (serverless with connection pooler)
- **ORM**: Prisma 5.x

---

## Operational Workflows

### 1. Health & Latency Probe
Check system health, database connection, and memory usage:
```bash
# In PowerShell:
Invoke-RestMethod -Uri "https://code-mind-k63e.onrender.com/health" -Method Get | ConvertTo-Json

# In Bash / curl:
curl -s "https://code-mind-k63e.onrender.com/health" | jq
```
Expected output:
```json
{
  "status": "healthy",
  "uptimeSeconds": 1200,
  "database": {
    "status": "ok",
    "latencyMs": 48
  },
  "memory": {
    "rssMb": 84,
    "heapUsedMb": 20
  }
}
```

### 2. Database Migrations
When schema changes are made in `backend/prisma/schema.prisma`:
1. Generate local migration file:
   ```bash
   npx prisma migrate dev --name <migration_name> --schema=backend/prisma/schema.prisma
   ```
2. In production (Render), migrations run automatically on container startup via `start:prod`:
   ```bash
   prisma migrate deploy && (node dist/src/main || node dist/main)
   ```

### 3. Neon Connection Pooling
- Neon uses `pgbouncer` connection pooling.
- The connection string configured in Render should always use the `-pooler` endpoint with SSL enabled:
  `postgresql://<user>:<pass>@ep-lively-breeze-za7inx4o-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require`

### 4. Container Build & Entrypoint Invariant
Because TypeScript compiles both `src/` and `prisma/`, NestJS outputs to `dist/src/main.js` rather than `dist/main.js`.
The Dockerfile and `start:prod` script account for this with:
```bash
node dist/src/main || node dist/main
```
