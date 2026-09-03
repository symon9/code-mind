# 🧠 CodeMind

**CodeMind** is a next-generation, cross-platform AI-native developer desktop IDE built with Electron, React, and NestJS. It seamlessly integrates multi-modal AI pair programming, workspace project file management, Monaco code editing, and intelligent context-aware chat to supercharge software engineering workflows.

---

## 🚀 Tech Stack

| Layer | Technologies & Tools | Description |
| :--- | :--- | :--- |
| **Desktop Shell** | [Electron](https://www.electronjs.org/) (v43+), IPC, Native Menus, Auto-Updater | Cross-platform desktop runtime for Windows, macOS, and Linux |
| **Frontend UI** | [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/) | High-performance reactive UI with rich dark theme aesthetics |
| **Code Editor** | [@monaco-editor/react](https://microsoft.github.io/monaco-editor/) | Visual Studio Code-grade editing experience with syntax highlighting |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) | Lightweight, predictable client-side state store |
| **Backend API** | [NestJS](https://nestjs.com/) (v11), Express, TypeScript | Modular enterprise backend service and AI orchestrator |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/) | Relational storage for users, chats, projects, tokens, and telemetry |
| **Cache & Realtime** | [Redis 7](https://redis.io/) | In-memory store for rate limiting, sessions, and fast caches |
| **AI Providers** | Anthropic Claude, OpenAI GPT, Google Gemini, Ollama | Multi-provider fallback orchestration with local & cloud LLMs |
| **Monorepo / Build** | [Turborepo](https://turbo.build/), [Vite](https://vitejs.dev/), [electron-builder](https://www.electron.build/) | High-speed monorepo build pipelines and desktop distributables |

---

## 📋 Prerequisites

Before running CodeMind locally, ensure you have the following installed on your machine:

- **Node.js**: `v20.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v10.0.0` or higher
- **Docker & Docker Compose**: For containerized PostgreSQL & Redis ([Docker Desktop](https://www.docker.com/))
- **Git**: For version control

---

## ⚡ Getting Started

Follow these steps to spin up the entire CodeMind stack in development mode:

### 1. Clone the Repository
```bash
git clone https://github.com/symon9/code-mind.git
cd code-mind
```

### 2. Run Environment Setup
Execute the automated setup script to generate local environment configuration files:
```bash
# On macOS / Linux / Git Bash:
chmod +x ./scripts/setup.sh
./scripts/setup.sh

# Or manually copy environment files:
cp backend/.env.example backend/.env
cp desktop/react/.env.example desktop/react/.env
```

### 3. Start Database and Redis Containers
Spin up PostgreSQL and Redis with Docker Compose:
```bash
docker compose up -d db redis
```

### 4. Install Monorepo Dependencies
Install all workspace dependencies across the repository:
```bash
npm install
```

### 5. Run Prisma Migrations & Seed Database
Initialize your PostgreSQL database with the required schema and default seed data:
```bash
cd backend
npx prisma migrate dev
npm run prisma:seed
cd ..
```

### 6. Launch CodeMind in Development Mode
Start both the NestJS backend and the Electron + React desktop application concurrently:
```bash
npm run dev
```

> **Tip:** You can also run the backend (`npm run dev:backend`) or desktop app (`npm run dev:desktop`) in separate terminal windows.

---

## 🤖 AI Provider Configuration

CodeMind features a flexible AI engine supporting multiple cloud models and self-hosted local LLMs with intelligent automatic fallback. Configure your API keys in `backend/.env`:

```env
# Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
ANTHROPIC_API_KEY="sk-ant-api..."

# OpenAI (GPT-4o, GPT-4 Turbo)
OPENAI_API_KEY="sk-proj-..."

# Google Gemini (Gemini 1.5 Pro, Gemini Flash)
GEMINI_API_KEY="AIzaSy..."

# Ollama (Local LLMs: Llama 3, DeepSeek Coder, Mistral)
OLLAMA_BASE_URL="http://localhost:11434"
```

### Using Ollama for Local Offline AI
1. Install [Ollama](https://ollama.com/).
2. Pull your preferred coding model:
   ```bash
   ollama pull llama3
   ollama pull deepseek-coder
   ```
3. Ensure Ollama is running at `http://localhost:11434`. CodeMind will automatically detect and route prompts to your local instance when selected.

---

## 📜 Monorepo Scripts Reference

The root `package.json` provides unified scripts to manage all packages in the monorepo:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs backend, React frontend, and Electron shell concurrently |
| `npm run dev:desktop` | Runs Vite dev server and launches Electron desktop window |
| `npm run dev:backend` | Starts NestJS backend with watch mode on port `3000` |
| `npm run build` | Builds the React frontend and compiles Electron main process |
| `npm run build:react` | Builds React renderer into `desktop/electron/renderer/` |
| `npm run build:electron` | Compiles Electron TypeScript files into `desktop/electron/dist/` |
| `npm run build:backend` | Compiles NestJS backend into `backend/dist/` |
| `npm run build:all` | Compiles desktop frontend, desktop shell, and backend API |
| `npm run test` | Runs unit and integration tests across workspaces |
| `npm run clean` | Cleans all `dist` and `renderer` build artifacts |

---

## 🗂️ Folder Structure

```text
code-mind/
├── .github/                   # CI/CD workflows and actions
├── backend/                   # NestJS Backend API & AI Engine
│   ├── prisma/                # Prisma schema, migrations, and seed script
│   │   ├── migrations/        # SQL database migrations
│   │   ├── schema.prisma      # Prisma schema models
│   │   └── seed.ts            # Default admin & plan seeder
│   ├── src/                   # NestJS modules (auth, ai, chat, files, projects, users)
│   ├── test/                  # E2E test suites
│   ├── Dockerfile             # Multi-stage production container build
│   └── package.json           # Backend dependencies and scripts
├── desktop/                   # Desktop IDE Application
│   ├── assets/                # Icons (icon.ico, icon.png, icon.icns)
│   ├── electron/              # Electron Main Process & Native IPC
│   │   ├── main.ts            # Window lifecycle & update management
│   │   ├── ipcHandlers.ts     # Native OS & File System IPC bridge
│   │   ├── menu.ts            # Custom desktop application menu
│   │   └── preload.ts         # Secure contextBridge interface
│   ├── react/                 # React UI (Vite + Monaco + Tailwind CSS)
│   │   ├── src/               # React components, stores, hooks, utils
│   │   └── vite.config.ts     # Vite configuration targeting electron/renderer
│   └── electron-builder.yml   # Multi-platform desktop packaging config
├── scripts/                   # Setup and maintenance helper scripts
├── shared/                    # Shared TypeScript interfaces & DTOs
├── docker-compose.yml         # Container orchestration (NestJS, Postgres, Redis)
├── turbo.json                 # Turborepo task pipeline configuration
├── .editorconfig              # Editor code styling rules
├── .prettierrc                # Code formatting configuration
└── package.json               # Root monorepo workspace configuration
```

---

## 🗺️ Roadmap & Architecture Phases

- [x] **Phase 1 — Core Architecture**: Monorepo scaffolding, Monaco Editor integration, File Tree explorer, and multi-tab layout.
- [x] **Phase 2 — AI Orchestration**: Multi-provider LLM hub (Anthropic, OpenAI, Gemini, Ollama), streaming tokens, code explanations, refactoring, and inline generation.
- [x] **Phase 3 — Data & Synchronization**: PostgreSQL schema, Prisma ORM, JWT authentication, user preferences, and project persistence.
- [x] **Phase 4 — Desktop Deep Integration**: Native IPC bridge, custom OS menus, file system watchers, auto-updater, and keyboard shortcuts.
- [x] **Phase 5 — Packaging, Containerization & CI/CD**: Multi-stage Docker deployment, `electron-builder` cross-platform installers, and automated test pipelines.

---

## 🤝 Contributing

Contributions to CodeMind are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'feat: add amazing feature'`.
4. Push to the branch: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
