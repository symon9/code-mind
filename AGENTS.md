# 🤖 AGENTS.md — CodeMind AI Agent Directives

Welcome to **CodeMind**! This document defines system operational rules, architectural constraints, and standard workflows for AI agents (including Google Antigravity, Cursor, Claude Code, and GitHub Copilot) operating inside this repository.

---

## 1. Monorepo Structure & Workspaces

The repository is organized as an npm workspace monorepo. Agents must execute commands from the appropriate directory or use workspace flags:

| Workspace | Directory | Role |
| :--- | :--- | :--- |
| `@codemind/react` | `desktop/react` | React 18 UI, Monaco editor, Zustand stores |
| `@codemind/electron` | `desktop/electron` | Electron main process, IPC bridge, updater |
| `@codemind/backend` | `backend` | NestJS 11 API, Prisma ORM, AI multi-provider |
| `@codemind/shared` | `shared` | Shared TypeScript types, interfaces, DTOs |

---

## 2. Essential Agent Commands

Always run workspace commands from the project root:

```bash
# 🧪 Testing
npm run test:react            # Run Vitest test suite in desktop/react
npm run test:backend          # Run Jest unit/e2e tests in backend
npm run test                  # Run both test suites

# 🔨 Building
npm run build:react           # Build React bundle into desktop/electron/renderer
npm run build:electron        # Compile Electron TypeScript into desktop/electron/dist
npm run build:backend         # Compile NestJS into backend/dist
npm run dist:desktop          # Package Windows NSIS installer & blockmap

# 🔍 Quality & Linting
npm run lint                  # Lint backend and frontend
npm run format                # Run prettier across entire monorepo

# 🚀 Database & Migrations
npx prisma migrate dev --schema=backend/prisma/schema.prisma
npx prisma generate --schema=backend/prisma/schema.prisma
```

---

## 3. Strict Development Rules for Agents

### Rule 1: Atomic Git Commits
When committing changes, agents **MUST** use atomic git commits with a concise subject and an explanatory body:
```bash
git commit -m "type(scope): short imperative subject" -m "Detailed explanation of what changed, why it changed, and any technical trade-offs."
```
Never lump unrelated frontend, backend, and CI changes into a single generic commit.

### Rule 2: Security & Zero Secret Exposure
- **NEVER** hardcode real database passwords, JWT secrets, or API keys in code or documentation.
- All sensitive user preferences (OpenAI, Anthropic, Gemini keys) **MUST** be encrypted via `AES-256-GCM` using `backend/src/common/crypto.util.ts` before database writes.
- Never track `.env` files. Verify with `git check-ignore <path>` before staging new environment files.

### Rule 3: Output Paths & Compilation Invariants
- React bundle must build into `desktop/electron/renderer/` (configured in `desktop/react/vite.config.ts`).
- Electron main process compiles into `desktop/electron/dist/`.
- Packaged production installer outputs to `desktop/electron/release/`.
- NestJS compiles to `backend/dist/src/main.js` (and `backend/dist/main.js`).

---

## 4. Agent Skills Catalog (`.agents/skills/`)

For specialized tasks, agents can invoke or read instructions from modular skill manifests located in `.agents/skills/`:

| Skill | Path | Description |
| :--- | :--- | :--- |
| **`release-manager`** | [`.agents/skills/release-manager/SKILL.md`](.agents/skills/release-manager/SKILL.md) | Guide for releasing new versions, bumping semver, and managing GitHub Actions |
| **`ai-provider-eval`** | [`.agents/skills/ai-provider-eval/SKILL.md`](.agents/skills/ai-provider-eval/SKILL.md) | Workflows for testing, benchmarking, and maintaining multi-LLM providers |
| **`backend-ops`** | [`.agents/skills/backend-ops/SKILL.md`](.agents/skills/backend-ops/SKILL.md) | Maintenance guide for Render deployment, Neon pooling, and health probes |

---

## 5. Live Production Infrastructure Reference

- **Backend API**: `https://code-mind-k63e.onrender.com`
- **Health Check Probe**: `https://code-mind-k63e.onrender.com/health`
- **Database**: Serverless PostgreSQL via Neon.tech (pooler enabled)
- **Desktop Releases**: `https://github.com/symon9/code-mind/releases`
- **Update Feed**: `https://github.com/symon9/code-mind/releases/latest/download/latest.yml`
