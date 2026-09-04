import { create } from 'zustand';
import type { EditorTab } from '../types';
import { detectLanguage } from '../utils/languageMap';
import { useToastStore } from './useToastStore';
import { getWebFileHandle } from './useFileTreeStore';

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: number;
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface EditorState {
  openTabs: EditorTab[];
  activeTabId: string | null;
  recentFiles: RecentFile[];
}

interface EditorActions {
  openFile: (path: string) => Promise<void>;
  createNewFile: () => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  updateContent: (id: string, content: string) => void;
  saveTab: (id: string) => Promise<void>;
  setActiveTab: (id: string) => void;
  addRecentFile: (path: string) => void;
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

const RECENT_FILES_KEY = 'codemind-recent-files';

function loadRecentFiles(): RecentFile[] {
  try {
    const raw = localStorage.getItem(RECENT_FILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentFiles(files: RecentFile[]) {
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files.slice(0, 10)));
  } catch (err) {
    console.error('Failed to save recent files', err);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>((set, get) => ({
  openTabs: [],
  activeTabId: null,
  recentFiles: loadRecentFiles(),

  addRecentFile: (path: string) => {
    const name = extractFilename(path);
    set((state) => {
      const filtered = state.recentFiles.filter((f) => f.path !== path);
      const updated = [{ path, name, lastOpened: Date.now() }, ...filtered].slice(0, 10);
      saveRecentFiles(updated);
      return { recentFiles: updated };
    });
  },

  createNewFile: () => {
    const id = `untitled-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newTab: EditorTab = {
      id,
      path: `Untitled-${get().openTabs.length + 1}.ts`,
      name: `Untitled-${get().openTabs.length + 1}.ts`,
      content: '// New file\n',
      isDirty: true,
      language: 'typescript',
    };

    set((state) => ({
      openTabs: [...state.openTabs, newTab],
      activeTabId: id,
    }));
  },

  openFile: async (path: string) => {
    const normalizedPath = path.replace(/\\/g, '/');
    const { openTabs, addRecentFile } = get();

    // If already open, just activate it
    const existing = openTabs.find(
      (tab) => tab.path === normalizedPath || tab.path === path
    );
    if (existing) {
      set({ activeTabId: existing.id });
      addRecentFile(path);
      return;
    }

    try {
      let content = '';
      if (window.codemind?.fs?.readFile) {
        content = await window.codemind.fs.readFile(path);
      } else {
        const webHandle = getWebFileHandle(path);
        if (webHandle) {
          const fileObj = await webHandle.getFile();
          content = await fileObj.text();
        } else {
          content = `// Content for ${extractFilename(path)}\nexport function demo() {\n  console.log("Loaded ${path}");\n}\n`;
        }
      }
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

      addRecentFile(path);
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

  closeAllTabs: () => {
    set({ openTabs: [], activeTabId: null });
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
      if (window.codemind?.fs?.writeFile) {
        await window.codemind.fs.writeFile(tab.path, tab.content);
      }
      set((state) => ({
        openTabs: state.openTabs.map((t) =>
          t.id === id ? { ...t, isDirty: false } : t
        ),
      }));
      useToastStore.getState().addToast(`Saved ${tab.name}`, 'success');
    } catch (err) {
      console.error(`[EditorStore] Failed to save file: ${tab.path}`, err);
      useToastStore.getState().addToast(`Failed to save ${tab.name}`, 'error');
    }
  },

  setActiveTab: (id: string) => {
    set({ activeTabId: id });
  },
}));
