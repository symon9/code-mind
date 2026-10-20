# CodeMind — Production Release & Deployment Guide

This guide covers building, signing, and deploying CodeMind for production.

---

## 1. Desktop App (Electron) Packaging

### Build Commands
From the project root:
- **Build Unpackaged Directory (Fast verification)**:
  ```bash
  npm run pack:desktop
  ```
  Generates `desktop/electron/release/win-unpacked/CodeMind.exe`.

- **Build NSIS Windows Installer Setup (`.exe`)**:
  ```bash
  npm run dist:desktop
  ```
  Generates `desktop/electron/release/CodeMind Setup 1.0.0.exe` (~108 MB compressed).

### Code Signing (Windows & macOS)
`electron-builder` automatically detects signing credentials from environment variables:

#### Windows (Authenticode OV / EV Certificate)
To avoid the Windows SmartScreen ("Unknown Publisher") prompt on end-user machines:
1. Obtain an Authenticode `.pfx` or `.p12` code signing certificate.
2. Set the following environment variables before running `npm run dist:desktop`:
   ```bash
   # In PowerShell / CI (GitHub Actions, etc.)
   $env:WIN_CSC_LINK = "C:\path\to\certificate.pfx"
   $env:WIN_CSC_KEY_PASSWORD = "your-certificate-password"
   ```
   *(Note: For hardware token EV certificates, use Azure Trusted Signing or DigiCert KeyLocker with `signtool.exe`.)*

#### macOS (Apple Developer ID & Notarization)
```bash
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="your-password"
export APPLE_ID="developer@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="TEAM123456"
```

---

## 2. Backend Deployment

### Automated Production Startup
In production, database migrations deploy automatically before the NestJS server starts:
```bash
npm run start:prod --workspace=@codemind/backend
# Executes: prisma migrate deploy && node dist/main
```

### Docker / Container Deployment
The root `docker-compose.yml` and `backend/Dockerfile` are multi-stage and monorepo-aware:
```bash
# Build and run backend + PostgreSQL in background
docker compose up -d --build
```

### Health Check Endpoint
Cloud load balancers (AWS ALB, Kubernetes, Railway, Render) can verify uptime and database connectivity:
```http
GET /health
```
**Sample Healthy Response (HTTP 200)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-20T10:15:00.000Z",
  "uptimeSeconds": 3600,
  "database": {
    "status": "ok",
    "latencyMs": 3
  },
  "memory": {
    "rssMb": 92,
    "heapUsedMb": 45,
    "heapTotalMb": 65
  }
}
```

---

## 3. Environment & Security Configuration

### Generating Production Secrets
Run the cryptographic secret generator:
```bash
npm run generate:secrets -- --write
```
This updates `backend/.env` with high-entropy 256-bit random keys for `JWT_SECRET` and `REFRESH_SECRET`.

### Environment Variables Checklist (`backend/.env`)
| Variable | Description | Recommended Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | HTTP Server port | `3000` (or host assigned) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | Token signing secret | 64-char hex generated via `generate:secrets` |
| `REFRESH_SECRET` | Refresh token secret | 64-char hex generated via `generate:secrets` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://your-domain.com,http://localhost:5173` |
| `AI_DAILY_FREE_LIMIT` | Daily quota for server key | `50` (or custom limit) |
| `OPENAI_API_KEY` | Server fallback key | `sk-proj-...` (optional if users BYOK) |
| `ANTHROPIC_API_KEY` | Server fallback key | `sk-ant-...` (optional if users BYOK) |
| `GEMINI_API_KEY` | Server fallback key | `AIzaSy...` (optional if users BYOK) |
| `OLLAMA_BASE_URL` | Local AI fallback | `http://localhost:11434` |

---

## 4. Bring-Your-Own-Key (BYOK) Architecture
- **User Keys**: Users can enter their personal OpenAI, Anthropic, or Gemini keys in **Settings &rarr; AI**.
- **Security**: User keys are encrypted in PostgreSQL using **AES-256-GCM** and masked on reads.
- **Quotas**: Requests using user-provided keys bypass all server quotas and incur $0 cost to the backend host.
