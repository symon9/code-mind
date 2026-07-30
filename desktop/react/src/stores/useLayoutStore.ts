import { create } from 'zustand';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface LayoutState {
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  sidebarWidth: number;
  aiPanelWidth: number;
}

interface LayoutActions {
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  setSidebarWidth: (width: number) => void;
  setAIPanelWidth: (width: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setAIPanelOpen: (open: boolean) => void;
}

type LayoutStore = LayoutState & LayoutActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarOpen: true,
  aiPanelOpen: true,
  sidebarWidth: 240,
  aiPanelWidth: 360,

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleAIPanel: () => {
    set((state) => ({ aiPanelOpen: !state.aiPanelOpen }));
  },

  setSidebarWidth: (width: number) => {
    set({ sidebarWidth: Math.max(180, Math.min(400, width)) });
  },

  setAIPanelWidth: (width: number) => {
    set({ aiPanelWidth: Math.max(280, Math.min(600, width)) });
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setAIPanelOpen: (open: boolean) => {
    set({ aiPanelOpen: open });
  },
}));
