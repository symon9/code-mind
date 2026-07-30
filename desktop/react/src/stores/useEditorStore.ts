import { create } from 'zustand';
import type { EditorTab } from '../types';
import { detectLanguage } from '../utils/languageMap';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface EditorState {
  openTabs: EditorTab[];
  activeTabId: string | null;
}

interface EditorActions {
  openFile: (path: string) => Promise<void>;
  closeTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  saveTab: (id: string) => Promise<void>;
  setActiveTab: (id: string) => void;
}

type EditorStore = EditorState & EditorActions;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTabId(path: string): string {
  return path.replace(/\\/g, '/');
}

function extractFilename(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || filePath;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>((set, get) => ({
  openTabs: [],
  activeTabId: null,

  openFile: async (path: string) => {
    const normalizedPath = path.replace(/\\/g, '/');
    const { openTabs } = get();

    // If already open, just activate it
    const existing = openTabs.find(
      (tab) => tab.path === normalizedPath || tab.path === path
    );
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    try {
      const content = await window.codemind.fs.readFile(path);
      const id = generateTabId(path);
      const name = extractFilename(path);
      const language = detectLanguage(path);

      const newTab: EditorTab = {
        id,
        path,
        name,
        content,
        isDirty: false,
        language,
      };

      set((state) => ({
        openTabs: [...state.openTabs, newTab],
        activeTabId: id,
      }));
    } catch (err) {
      console.error(`[EditorStore] Failed to open file: ${path}`, err);
    }
  },

  closeTab: (id: string) => {
    set((state) => {
      const idx = state.openTabs.findIndex((tab) => tab.id === id);
      if (idx === -1) return state;

      const newTabs = state.openTabs.filter((tab) => tab.id !== id);
      let newActiveId = state.activeTabId;

      // If we closed the active tab, pick a neighbor
      if (state.activeTabId === id) {
        if (newTabs.length === 0) {
          newActiveId = null;
        } else if (idx < newTabs.length) {
          newActiveId = newTabs[idx].id;
        } else {
          newActiveId = newTabs[newTabs.length - 1].id;
        }
      }

      return { openTabs: newTabs, activeTabId: newActiveId };
    });
  },

  updateContent: (id: string, content: string) => {
    set((state) => ({
      openTabs: state.openTabs.map((tab) =>
        tab.id === id ? { ...tab, content, isDirty: true } : tab
      ),
    }));
  },

  saveTab: async (id: string) => {
    const { openTabs } = get();
    const tab = openTabs.find((t) => t.id === id);
    if (!tab) return;

    try {
      await window.codemind.fs.writeFile(tab.path, tab.content);
      set((state) => ({
        openTabs: state.openTabs.map((t) =>
          t.id === id ? { ...t, isDirty: false } : t
        ),
      }));
    } catch (err) {
      console.error(`[EditorStore] Failed to save file: ${tab.path}`, err);
    }
  },

  setActiveTab: (id: string) => {
    set({ activeTabId: id });
  },
}));
