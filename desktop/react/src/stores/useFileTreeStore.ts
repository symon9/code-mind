import { create } from 'zustand';
import type { FileNode } from '../types';
import { useEditorStore } from './useEditorStore';

// Store web directory handle & file handles map for browser mode
let webDirHandle: any = null;
const webFileHandlesMap = new Map<string, any>();

export interface RecentFolder {
  path: string;
  name: string;
  lastOpened: number;
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface FileTreeState {
  rootPath: string | null;
  fileTree: FileNode[];
  isLoading: boolean;
  expandedFolders: Set<string>;
  recentFolders: RecentFolder[];
}

interface FileTreeActions {
  setRootPath: (path: string) => void;
  loadTree: () => Promise<void>;
  openFolder: () => Promise<void>;
  openRecentFolder: (path: string) => Promise<void>;
  closeFolder: () => void;
  toggleFolder: (path: string) => void;
  setExpandedFolders: (paths: Set<string>) => void;
  addRecentFolder: (path: string) => void;
}

type FileTreeStore = FileTreeState & FileTreeActions;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractFolderName(folderPath: string): string {
  const parts = folderPath.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || folderPath;
}

const RECENT_FOLDERS_KEY = 'codemind-recent-folders';

function loadRecentFolders(): RecentFolder[] {
  try {
    const raw = localStorage.getItem(RECENT_FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentFolders(folders: RecentFolder[]) {
  try {
    localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(folders.slice(0, 10)));
  } catch (err) {
    console.error('Failed to save recent folders', err);
  }
}

// ─── Helper for Web File System Access API ─────────────────────────────────────

async function readWebDirectory(
  dirHandle: any,
  parentPath: string,
  depth = 1,
  maxDepth = 4
): Promise<FileNode[]> {
  const nodes: FileNode[] = [];

  try {
    for await (const entry of dirHandle.values()) {
      const itemPath = `${parentPath}/${entry.name}`;

      if (entry.kind === 'directory') {
        const children =
          depth < maxDepth
            ? await readWebDirectory(entry, itemPath, depth + 1, maxDepth)
            : [];
        nodes.push({
          name: entry.name,
          path: itemPath,
          type: 'folder',
          children,
        });
      } else if (entry.kind === 'file') {
        webFileHandlesMap.set(itemPath, entry);
        nodes.push({
          name: entry.name,
          path: itemPath,
          type: 'file',
        });
      }
    }
  } catch (err) {
    console.error('Error reading web directory', err);
  }

  return nodes.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1
  );
}

export function getWebFileHandle(path: string) {
  return webFileHandlesMap.get(path);
}

// ─── Fallback Sample Project for Browser Mode ─────────────────────────────────

const getSampleTree = (rootPath: string): FileNode[] => [
  {
    name: 'src',
    path: `${rootPath}/src`,
    type: 'folder',
    children: [
      { name: 'App.tsx', path: `${rootPath}/src/App.tsx`, type: 'file' },
      { name: 'index.tsx', path: `${rootPath}/src/index.tsx`, type: 'file' },
      { name: 'main.css', path: `${rootPath}/src/main.css`, type: 'file' },
    ],
  },
  {
    name: 'components',
    path: `${rootPath}/components`,
    type: 'folder',
    children: [
      { name: 'Header.tsx', path: `${rootPath}/components/Header.tsx`, type: 'file' },
      { name: 'Footer.tsx', path: `${rootPath}/components/Footer.tsx`, type: 'file' },
    ],
  },
  { name: 'package.json', path: `${rootPath}/package.json`, type: 'file' },
  { name: 'README.md', path: `${rootPath}/README.md`, type: 'file' },
];

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFileTreeStore = create<FileTreeStore>((set, get) => ({
  rootPath: null,
  fileTree: [],
  isLoading: false,
  expandedFolders: new Set<string>(),
  recentFolders: loadRecentFolders(),

  addRecentFolder: (path: string) => {
    const name = extractFolderName(path);
    set((state) => {
      const filtered = state.recentFolders.filter((f) => f.path !== path);
      const updated = [{ path, name, lastOpened: Date.now() }, ...filtered].slice(0, 10);
      saveRecentFolders(updated);
      return { recentFolders: updated };
    });
  },

  setRootPath: (path: string) => {
    set({ rootPath: path });
    get().addRecentFolder(path);
  },

  loadTree: async () => {
    const { rootPath } = get();
    if (!rootPath) return;

    set({ isLoading: true });

    try {
      if (window.codemind?.fs?.readDir) {
        const tree = await window.codemind.fs.readDir(rootPath);
        set({ fileTree: tree, isLoading: false });
      } else if (webDirHandle) {
        const tree = await readWebDirectory(webDirHandle, rootPath);
        set({ fileTree: tree, isLoading: false });
      } else {
        set({ fileTree: getSampleTree(rootPath), isLoading: false });
      }
    } catch (err) {
      console.error(`[FileTreeStore] Failed to load tree: ${rootPath}`, err);
      set({ fileTree: getSampleTree(rootPath), isLoading: false });
    }
  },

  openFolder: async () => {
    try {
      // 1. Electron Desktop Environment
      if (window.codemind?.fs?.openFolderDialog) {
        const folderPath = await window.codemind.fs.openFolderDialog();
        if (!folderPath) return;

        set({ rootPath: folderPath, expandedFolders: new Set<string>() });
        get().addRecentFolder(folderPath);
        await get().loadTree();
        return;
      }

      // 2. Modern Web Browser API (showDirectoryPicker)
      if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker();
          if (dirHandle) {
            webDirHandle = dirHandle;
            webFileHandlesMap.clear();
            const rootName = dirHandle.name;

            set({ rootPath: rootName, expandedFolders: new Set<string>() });
            get().addRecentFolder(rootName);
            const tree = await readWebDirectory(dirHandle, rootName);
            set({ fileTree: tree, isLoading: false });
            return;
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            return;
          }
          console.warn('showDirectoryPicker failed, falling back to sample tree', err);
        }
      }

      // 3. Fallback Sample Project if picker unsupported/failed
      const sampleRoot = 'C:/Projects/code-mind';
      set({ rootPath: sampleRoot, expandedFolders: new Set<string>() });
      get().addRecentFolder(sampleRoot);
      await get().loadTree();
    } catch (err) {
      console.error('[FileTreeStore] Failed to open folder dialog', err);
    }
  },

  openRecentFolder: async (path: string) => {
    set({ rootPath: path, expandedFolders: new Set<string>() });
    get().addRecentFolder(path);
    await get().loadTree();
  },

  closeFolder: () => {
    webDirHandle = null;
    webFileHandlesMap.clear();
    set({ rootPath: null, fileTree: [], expandedFolders: new Set<string>() });
    useEditorStore.getState().closeAllTabs();
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
