import { create } from 'zustand';
import type { FileNode } from '../types';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface FileTreeState {
  rootPath: string | null;
  fileTree: FileNode[];
  isLoading: boolean;
  expandedFolders: Set<string>;
}

interface FileTreeActions {
  setRootPath: (path: string) => void;
  loadTree: () => Promise<void>;
  openFolder: () => Promise<void>;
  toggleFolder: (path: string) => void;
  setExpandedFolders: (paths: Set<string>) => void;
}

type FileTreeStore = FileTreeState & FileTreeActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFileTreeStore = create<FileTreeStore>((set, get) => ({
  rootPath: null,
  fileTree: [],
  isLoading: false,
  expandedFolders: new Set<string>(),

  setRootPath: (path: string) => {
    set({ rootPath: path });
  },

  loadTree: async () => {
    const { rootPath } = get();
    if (!rootPath) return;

    set({ isLoading: true });

    try {
      const tree = await window.codemind.fs.readDir(rootPath);
      set({ fileTree: tree, isLoading: false });
    } catch (err) {
      console.error(`[FileTreeStore] Failed to load tree: ${rootPath}`, err);
      set({ fileTree: [], isLoading: false });
    }
  },

  openFolder: async () => {
    try {
      const folderPath = await window.codemind.fs.openFolderDialog();
      if (!folderPath) return;

      set({ rootPath: folderPath, expandedFolders: new Set<string>() });
      // Load the tree after setting the new root
      await get().loadTree();
    } catch (err) {
      console.error('[FileTreeStore] Failed to open folder dialog', err);
    }
  },

  toggleFolder: (path: string) => {
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedFolders: next };
    });
  },

  setExpandedFolders: (paths: Set<string>) => {
    set({ expandedFolders: paths });
  },
}));
