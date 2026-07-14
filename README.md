# CodeMind

CodeMind is a cross-platform AI-powered desktop code editor built with Electron, React, and NestJS.

## Project Structure

```
codemind/
  desktop/
    electron/          # Electron main process
    react/             # React renderer (Vite + React + Tailwind CSS)
  backend/
    src/               # NestJS application
    prisma/            # Prisma schema & migrations
  shared/              # Shared TypeScript types used by both desktop and backend
  docs/                # Documentation
  scripts/             # Helper scripts
```

## Running the Application

### Setup
Install dependencies at the root:
```bash
npm install
```

### Development
- Run both React renderer and Electron:
  ```bash
  npm run dev:desktop
  ```
- Run NestJS backend:
  ```bash
  npm run dev:backend
  ```

### Build
- Build Electron & React app:
  ```bash
  npm run build:desktop
  ```
- Build NestJS backend:
  ```bash
  npm run build:backend
  ```
