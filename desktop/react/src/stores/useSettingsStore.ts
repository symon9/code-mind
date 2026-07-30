import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider, AppSettings, Theme } from '../types';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setWordWrap: (wrap: AppSettings['wordWrap']) => void;
  setAIProvider: (provider: AIProvider) => void;
  setDefaultLanguage: (lang: string) => void;
  resetToDefaults: () => void;
}

type SettingsStore = AppSettings & SettingsActions;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
  wordWrap: 'on',
  aiProvider: 'openai',
  defaultLanguage: 'typescript',
};

// ─── Store (Persisted to localStorage) ────────────────────────────────────────

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme: Theme) => set({ theme }),
      setFontSize: (fontSize: number) => set({ fontSize }),
      setFontFamily: (fontFamily: string) => set({ fontFamily }),
      setWordWrap: (wordWrap: AppSettings['wordWrap']) => set({ wordWrap }),
      setAIProvider: (aiProvider: AIProvider) => set({ aiProvider }),
      setDefaultLanguage: (defaultLanguage: string) => set({ defaultLanguage }),
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'codemind-settings',
    }
  )
);
