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

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'local';

// ─── Settings ─────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';

export interface AppSettings {
  theme: Theme;
  fontSize: number;
  fontFamily: string;
  wordWrap: 'on' | 'off' | 'wordWrapColumn';
  aiProvider: AIProvider;
  defaultLanguage: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
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
