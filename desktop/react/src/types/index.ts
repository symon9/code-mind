// ─── File Tree ────────────────────────────────────────────────────────────────

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

// ─── Editor Tabs ──────────────────────────────────────────────────────────────

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  language: string;
}

// ─── AI / Chat ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

export type AIProvider = 'anthropic' | 'openai' | 'ollama' | 'gemini' | 'local';

// ─── Settings ─────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'pitch-black' | 'light' | 'system';

export interface AppSettings {
  theme: Theme;
  fontSize: number;
  fontFamily: string;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  autoSave: boolean;
  tabSize: 2 | 4;
  aiProvider: AIProvider;
  defaultLanguage: string;
  ollamaUrl: string;
}

// ─── Auth & API ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  fieldErrors?: Record<string, string>;
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

export interface ContextMenuAction {
  label: string;
  action: string;
  icon?: string;
  separator?: boolean;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface UpdateStatusPayload {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  error?: string;
}

export interface CodemindApi {
  fs?: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    openDialog: () => Promise<string[]>;
    openFolderDialog: () => Promise<string>;
    saveDialog: (defaultName?: string) => Promise<string>;
    readDir: (path: string) => Promise<FileNode[]>;
  };
  app?: {
    getVersion: () => Promise<string>;
    platform: () => Promise<string>;
  };
  updater?: {
    checkForUpdates: () => Promise<{ status: string; version?: string; error?: string; message?: string }>;
    quitAndInstall: () => Promise<void>;
    onStatusChange: (callback: (payload: UpdateStatusPayload) => void) => () => void;
  };
}

declare global {
  interface Window {
    codemind?: CodemindApi;
    codemindGetActiveSelection?: () => string;
    codemindInsertSnippet?: (snippet: string) => void;
  }
}




