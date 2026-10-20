# 🏗️ CodeMind Architecture & System Specification

CodeMind is an AI-native developer desktop IDE designed for seamless pair programming, intelligent code generation, Monaco-powered editing, and persistent multi-modal AI chat sessions.

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client["Desktop Client (Electron and React)"]
        subgraph ElectronMain["Electron Main Process (Node.js)"]
            IPCMain["IPC Main Handlers"]
            NativeMenu["Native Application Menus"]
            FSHandler["File System Handlers"]
            AutoUpdaterModule["electron-updater"]
        end

        subgraph ElectronRenderer["Renderer Process (Chromium)"]
            ReactApp["React 18 UI Shell"]
            Monaco["Monaco Editor"]
            StateStores["Zustand Stores"]
            PreloadBridge["Context Bridge"]
        end

        PreloadBridge ---|"IPC Channels"| IPCMain
        PreloadBridge --- ReactApp
    end

    subgraph CloudBackend["Cloud Backend (Render / Docker)"]
        NestApp["NestJS 11 Application"]
        Throttler["Throttler Rate Limiter"]
        AuthModule["JWT Auth and BCrypt"]
        AIModule["AI Orchestration Engine"]
        HealthEndpoint["Health and Latency Probe"]
        CryptoUtil["AES-256-GCM Crypto Engine"]
    end

    subgraph DataStorage["Data and AI Services"]
        NeonDB[("Neon.tech Serverless PostgreSQL")]
        PrismaORM["Prisma ORM and Migrations"]
        Gemini["Google Gemini API"]
        Claude["Anthropic Claude API"]
        OpenAI["OpenAI GPT-4o API"]
        Ollama["Local Ollama Instances"]
        GitHubReleases["GitHub Releases API"]
    end

    ReactApp -->|"HTTPS, REST, SSE"| NestApp
    AutoUpdaterModule -->|"HTTPS Manifest Check"| GitHubReleases
    NestApp --> PrismaORM
    PrismaORM --> NeonDB
    AIModule --> Gemini
    AIModule --> Claude
    AIModule --> OpenAI
    AIModule --> Ollama
```

---

## 2. Monorepo Organization & Workspace Layout

CodeMind is organized as an npm workspace monorepo managed with Turborepo:

```
code-mind/
├── .agents/                      # AI Agent Skills & Customizations
│   └── skills/                   # Modular Agent Skills (release, ai-eval, backend-ops)
├── .github/                      # GitHub Workflows & CI/CD Pipelines
│   └── workflows/release.yml     # Automated desktop packaging & GitHub Release
├── backend/                      # Enterprise NestJS Backend Service
│   ├── prisma/                   # Prisma Schema & Database Migrations
│   │   ├── schema.prisma         # Data models (User, Preference, Session, Message)
│   │   └── migrations/           # Versioned SQL migration history
│   ├── src/
│   │   ├── ai/                   # Multi-provider LLM orchestrator & BYOK resolvers
│   │   ├── auth/                 # JWT authentication, guards, and refresh strategy
│   │   ├── common/               # AES-256-GCM encryption & rate limiters
│   │   ├── health/               # Dynamic database latency probe
│   │   ├── projects/             # Cloud-synced project records
│   │   ├── users/                # User profile & encrypted preferences
│   │   └── main.ts               # Express bootstrapping & Dynamic CORS
│   └── Dockerfile                # Multi-stage production container
├── desktop/
│   ├── electron/                 # Electron Desktop Native Shell
│   │   ├── main.ts               # Main process window lifecycle & security
│   │   ├── preload.ts            # Context isolation bridge
│   │   ├── ipcHandlers.ts        # Secure file system access
│   │   ├── updater.ts            # electron-updater event streaming
│   │   └── electron-builder.yml  # Packaging & GitHub Releases target
│   └── react/                    # Modern React 18 User Interface
│       ├── src/
│       │   ├── components/       # UI Components (Editor, AI Panel, Settings, Sidebar)
│       │   ├── stores/           # Zustand reactive state stores
│       │   ├── utils/            # API client with typed exception parsing
│       │   └── types/            # TypeScript domain interfaces & CodemindApi
│       └── vite.config.ts        # Rolldown/Vite bundler targeting electron/renderer
├── shared/                       # Shared contracts, DTOs, and types
├── scripts/                      # Setup scripts and cryptographic key generators
├── AGENTS.md                     # AI Agent System Instructions & Guidelines
├── README.md                     # Project overview and local quickstart
└── RELEASE.md                    # Production release and deployment documentation
```

---

## 3. Core Subsystems

### 3.1 Security & Shell Sandbox Model
- **Context Isolation**: Electron renderer has `nodeIntegration: false` and `contextIsolation: true`. All native interactions (`fs:readFile`, `fs:writeFile`, `app:getVersion`, `updater:*`) must pass through the typed preload bridge.
- **External URL Hardening**: External links in webview or windows are intercepted via `setWindowOpenHandler` and opened in the user's default OS browser, blocking renderer window takeovers.
- **Dynamic CORS**: The backend evaluates origins dynamically. In production, desktop origins (`app://`, `file://`) and configured domains are allowed, while unauthorized web origins are rejected.
- **Rate Limiting**: NestJS `@nestjs/throttler` applies multi-tier rate limiting:
  - Global routes: 120 requests / min
  - Auth routes: 15 requests / min
  - AI endpoints: 30 requests / min

---

### 3.2 Multi-Provider AI Engine & BYOK Architecture
The AI subsystem (`backend/src/ai/ai.service.ts`) supports dynamic routing across 4 providers:

```mermaid
sequenceDiagram
    autonumber
    actor User as Desktop User
    participant React as React UI
    participant Backend as NestJS AI Engine
    participant Crypto as Crypto Engine
    participant DB as Neon PostgreSQL
    participant Provider as AI Provider

    User->>React: Submit Prompt or Code Action
    React->>Backend: POST /ai/chat (JWT Bearer)
    Backend->>DB: Query User Preference
    DB-->>Backend: Encrypted Preferences

    alt User provided custom API key (BYOK)
        Backend->>Crypto: Decrypt Key (AES-256-GCM)
        Crypto-->>Backend: Plaintext API Key
        Note over Backend,Provider: Bypasses server daily fair-use quota
        Backend->>Provider: Execute prompt with user key
    else No custom key (Server Fallback)
        Backend->>DB: Check daily usage within quota limit
        Backend->>Provider: Execute prompt with server fallback key
    end

    Provider-->>Backend: Stream or Response
    Backend->>DB: Log token usage telemetry
    Backend-->>React: Output text or code patch
    React-->>User: Render syntax-highlighted response
```

#### Key Capabilities:
1. **Zero-Friction Access**: If `GEMINI_API_KEY` is configured in Render environment variables, users can chat immediately without entering an API key.
2. **Encrypted BYOK**: Users can paste personal keys in Settings. Keys are encrypted via `crypto.util.ts` with AES-256-GCM using `SETTINGS_ENCRYPTION_KEY` before persistence, preventing plaintext leaks even to database administrators.
3. **Graceful Fallbacks**: If a provider fails or encounters upstream rate limits, the orchestrator cascades down the configured priority chain (Gemini &rarr; Claude &rarr; OpenAI &rarr; Ollama).

---

### 3.3 Production Auto-Update Lifecycle
CodeMind utilizes differential blockmap updates powered by GitHub Releases and `electron-updater`:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Git as Git Repository
    participant Actions as GitHub Actions CI
    participant Releases as GitHub Releases
    participant Client as User Desktop App

    Dev->>Git: git push origin v1.0.1
    Git->>Actions: Trigger release.yml workflow
    Actions->>Actions: Build React + Electron + NSIS
    Actions->>Releases: Publish installer, blockmap, latest.yml
    
    Note over Client: User launches CodeMind
    Client->>Releases: Query latest.yml manifest
    Releases-->>Client: New version v1.0.1 (SHA-512 match)
    Client->>Releases: Download differential blockmap in background
    Client-->>Client: Stream download progress to UI
    Client->>Client: Display update toast: Update Ready to Install
    Client->>Client: User clicks Restart to apply update
```

---

## 4. Database Schema (Prisma)

The persistence layer runs on serverless PostgreSQL (Neon.tech) with connection pooling enabled:

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ CHAT_SESSION : creates
    USER ||--o{ FILE : uploads
    USER ||--|| PREFERENCE : configures
    USER ||--o{ REFRESH_TOKEN : authenticates
    CHAT_SESSION ||--o{ CHAT_MESSAGE : contains
    PROJECT ||--o{ FILE : organizes
    USER ||--o{ AI_REQUEST : tracks

    USER {
        string id PK
        string email UK
        string password
        string name
        datetime createdAt
    }
    PREFERENCE {
        string id PK
        string userId FK
        string theme
        string aiProvider
        string geminiApiKey "AES-256-GCM Encrypted"
        string openaiApiKey "AES-256-GCM Encrypted"
        string anthropicApiKey "AES-256-GCM Encrypted"
    }
    CHAT_SESSION {
        string id PK
        string userId FK
        string title
    }
    CHAT_MESSAGE {
        string id PK
        string sessionId FK
        string role
        string content
    }
```
