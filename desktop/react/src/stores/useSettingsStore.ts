import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider, AppSettings, Theme } from '../types';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setWordWrap: (wrap: AppSettings['wordWrap']) => void;
  setAutoSave: (autoSave: boolean) => void;
  setTabSize: (tabSize: 2 | 4) => void;
  setAIProvider: (provider: AIProvider) => void;
  setDefaultLanguage: (lang: string) => void;
  setOllamaUrl: (url: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
}

type SettingsStore = AppSettings & SettingsActions;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'JetBrains Mono',
  wordWrap: 'on',
  autoSave: true,
  tabSize: 2,
  aiProvider: 'openai',
  defaultLanguage: 'typescript',
  ollamaUrl: 'http://localhost:11434',
};

// ─── Store (Persisted to localStorage) ────────────────────────────────────────

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme: Theme) => set({ theme }),
      setFontSize: (fontSize: number) => set({ fontSize: Math.max(10, Math.min(24, fontSize)) }),
      setFontFamily: (fontFamily: string) => set({ fontFamily }),
      setWordWrap: (wordWrap: AppSettings['wordWrap']) => set({ wordWrap }),
      setAutoSave: (autoSave: boolean) => set({ autoSave }),
      setTabSize: (tabSize: 2 | 4) => set({ tabSize }),
      setAIProvider: (aiProvider: AIProvider) => set({ aiProvider }),
      setDefaultLanguage: (defaultLanguage: string) => set({ defaultLanguage }),
      setOllamaUrl: (ollamaUrl: string) => set({ ollamaUrl }),
      updateSettings: (updates: Partial<AppSettings>) => set((state) => ({ ...state, ...updates })),
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'codemind-settings',
    }
  )
);
