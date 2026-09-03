import { create } from 'zustand';

export type SettingsTab = 'editor' | 'appearance' | 'ai' | 'shortcuts';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface LayoutState {
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  topMenuBarOpen: boolean;
  sidebarWidth: number;
  aiPanelWidth: number;
  isSettingsOpen: boolean;
  activeSettingsTab: SettingsTab;
}

interface LayoutActions {
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  toggleTopMenuBar: () => void;
  setSidebarWidth: (width: number) => void;
  setAIPanelWidth: (width: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setAIPanelOpen: (open: boolean) => void;
  setTopMenuBarOpen: (open: boolean) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setActiveSettingsTab: (tab: SettingsTab) => void;
}

type LayoutStore = LayoutState & LayoutActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarOpen: true,
  aiPanelOpen: true,
  topMenuBarOpen: true,
  sidebarWidth: 240,
  aiPanelWidth: 320,
  isSettingsOpen: false,
  activeSettingsTab: 'editor',

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  toggleAIPanel: () => {
    set((state) => ({ aiPanelOpen: !state.aiPanelOpen }));
  },

  toggleTopMenuBar: () => {
    set((state) => ({ topMenuBarOpen: !state.topMenuBarOpen }));
  },

  setSidebarWidth: (width: number) => {
    set({ sidebarWidth: Math.max(150, Math.min(600, width)) });
  },

  setAIPanelWidth: (width: number) => {
    set({ aiPanelWidth: Math.max(240, Math.min(800, width)) });
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  setAIPanelOpen: (open: boolean) => {
    set({ aiPanelOpen: open });
  },

  setTopMenuBarOpen: (open: boolean) => {
    set({ topMenuBarOpen: open });
  },

  openSettings: (tab: SettingsTab = 'editor') => {
    set({ isSettingsOpen: true, activeSettingsTab: tab });
  },

  closeSettings: () => {
    set({ isSettingsOpen: false });
  },

  setActiveSettingsTab: (activeSettingsTab: SettingsTab) => {
    set({ activeSettingsTab });
  },
}));
