import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { TopMenuBar } from './TopMenuBar';
import { Sidebar } from '../sidebar/Sidebar';
import { EditorArea } from '../editor/EditorArea';
import { AIPanel } from '../ai/AIPanel';
import { StatusBar } from '../statusbar/StatusBar';
import { ToastContainer } from '../common/ToastContainer';
import { SettingsModal } from '../settings/SettingsModal';
import { LoginPage } from '../auth/LoginPage';
import { RegisterPage } from '../auth/RegisterPage';

// ─── Component ────────────────────────────────────────────────────────────────

export const AppShell: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);

  // Sync theme with document element attribute data-theme
  useEffect(() => {
    let effectiveTheme = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme]);

  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const aiPanelOpen = useLayoutStore((s) => s.aiPanelOpen);
  const topMenuBarOpen = useLayoutStore((s) => s.topMenuBarOpen);
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth);
  const aiPanelWidth = useLayoutStore((s) => s.aiPanelWidth);
  const setSidebarWidth = useLayoutStore((s) => s.setSidebarWidth);
  const setAIPanelWidth = useLayoutStore((s) => s.setAIPanelWidth);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const toggleAIPanel = useLayoutStore((s) => s.toggleAIPanel);
  const openSettings = useLayoutStore((s) => s.openSettings);

  const activeTabId = useEditorStore((s) => s.activeTabId);
  const closeTab = useEditorStore((s) => s.closeTab);
  const openTabs = useEditorStore((s) => s.openTabs);
  const saveTab = useEditorStore((s) => s.saveTab);

  const currentView = useAuthStore((s) => s.currentView);
  const setCurrentView = useAuthStore((s) => s.setCurrentView);

  // Resizing state
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Sync window hash location with Zustand Auth store
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#/login' || hash === '#login') {
        setCurrentView('login');
      } else if (hash === '#/register' || hash === '#register') {
        setCurrentView('register');
      } else if (hash === '#/editor' || hash === '#editor' || !hash) {
        setCurrentView('editor');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setCurrentView]);

  // Cursor position for status bar
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);

  // Background Auto-Update Ready Notification
  const [downloadedUpdateVersion, setDownloadedUpdateVersion] = useState<string | null>(null);

  useEffect(() => {
    if (window.codemind?.updater?.onStatusChange) {
      const unsubscribe = window.codemind.updater.onStatusChange((payload) => {
        if (payload.status === 'downloaded' && payload.version) {
          setDownloadedUpdateVersion(payload.version);
        }
      });
      return unsubscribe;
    }
  }, []);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorLine(line);
    setCursorColumn(column);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;

      // Cmd/Ctrl + , → Open Settings Modal
      if (isCtrlCmd && e.key === ',') {
        e.preventDefault();
        openSettings();
      }

      // Ctrl+B → Toggle Sidebar
      if (isCtrlCmd && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl+J → Toggle AI Panel
      if (isCtrlCmd && e.key === 'j') {
        e.preventDefault();
        toggleAIPanel();
      }

      // Ctrl+W → Close active tab
      if (isCtrlCmd && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          const tab = openTabs.find((t) => t.id === activeTabId);
          if (tab?.isDirty) {
            const confirmed = window.confirm(
              `"${tab.name}" has unsaved changes. Close without saving?`
            );
            if (!confirmed) return;
          }
          closeTab(activeTabId);
        }
      }

      // Ctrl+S → Save (fallback for when editor doesn't have focus)
      if (isCtrlCmd && e.key === 's') {
        e.preventDefault();
        if (activeTabId) {
          saveTab(activeTabId);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar, toggleAIPanel, openSettings, activeTabId, closeTab, openTabs, saveTab]);

  // ─── Mouse Drag Resizing Handlers ─────────────────────────────────────────

  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setSidebarWidth(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleAIPanelResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      setAIPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingRight(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // View Routing Render
  if (currentView === 'login') {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  if (currentView === 'register') {
    return (
      <>
        <RegisterPage />
        <ToastContainer />
      </>
    );
  }

  const isResizing = isResizingLeft || isResizingRight;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-0 select-none">
      {/* Top Application Menu Bar */}
      {topMenuBarOpen && <TopMenuBar />}

      {/* Transparent overlay while resizing to capture mouse events smoothly over Monaco editor/iframes */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
      )}

      {/* Main Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Sidebar */}
        <div
          className={`shrink-0 overflow-hidden ${isResizing ? '' : 'panel-transition'}`}
          style={{ width: sidebarOpen ? `${sidebarWidth}px` : '40px' }}
        >
          <Sidebar />
        </div>

        {/* Left Resizer Splitter Handle (VS Code style) */}
        {sidebarOpen && (
          <div
            onMouseDown={handleSidebarResizeStart}
            onDoubleClick={() => setSidebarWidth(240)}
            className="w-1.5 hover:w-1.5 bg-transparent hover:bg-accent/40 active:bg-accent cursor-col-resize z-20 shrink-0 select-none transition-colors group flex items-center justify-center -mx-[3px]"
            title="Drag to resize sidebar (Double click to reset)"
          >
            <div className="w-[1px] h-full bg-border group-hover:bg-accent/60" />
          </div>
        )}

        {/* Editor Area (flex-grow center) */}
        <EditorArea onCursorChange={handleCursorChange} />

        {/* Right Resizer Splitter Handle (VS Code style) */}
        {aiPanelOpen && (
          <div
            onMouseDown={handleAIPanelResizeStart}
            onDoubleClick={() => setAIPanelWidth(320)}
            className="w-1.5 hover:w-1.5 bg-transparent hover:bg-accent/40 active:bg-accent cursor-col-resize z-20 shrink-0 select-none transition-colors group flex items-center justify-center -mx-[3px]"
            title="Drag to resize AI panel (Double click to reset)"
          >
            <div className="w-[1px] h-full bg-border group-hover:bg-accent/60" />
          </div>
        )}

        {/* Right AI Panel */}
        <div
          className={`shrink-0 overflow-hidden ${isResizing ? '' : 'panel-transition'}`}
          style={{ width: aiPanelOpen ? `${aiPanelWidth}px` : '40px' }}
        >
          <AIPanel />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar cursorLine={cursorLine} cursorColumn={cursorColumn} />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Floating Auto-Update Ready Notification */}
      {downloadedUpdateVersion && (
        <div className="fixed bottom-8 right-6 z-40 bg-surface-100/95 border border-emerald-500/40 rounded-xl shadow-2xl p-3.5 backdrop-blur-md flex items-center gap-3 animate-slide-up">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">

          </div>
          <div>
            <div className="text-xs font-semibold text-text-primary">Update Ready to Install</div>
            <div className="text-[11px] text-text-muted">CodeMind v{downloadedUpdateVersion} has downloaded</div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => window.codemind?.updater?.quitAndInstall?.()}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-sm transition-all cursor-pointer"
            >
              Restart
            </button>
            <button
              onClick={() => setDownloadedUpdateVersion(null)}
              className="p-1 text-text-muted hover:text-text-primary rounded text-xs cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
