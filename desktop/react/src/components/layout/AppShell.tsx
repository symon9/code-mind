import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { Sidebar } from '../sidebar/Sidebar';
import { EditorArea } from '../editor/EditorArea';
import { AIPanel } from '../ai/AIPanel';
import { StatusBar } from '../statusbar/StatusBar';
import { ToastContainer } from '../common/ToastContainer';

// ─── Component ────────────────────────────────────────────────────────────────

export const AppShell: React.FC = () => {
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const aiPanelOpen = useLayoutStore((s) => s.aiPanelOpen);
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth);
  const aiPanelWidth = useLayoutStore((s) => s.aiPanelWidth);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const toggleAIPanel = useLayoutStore((s) => s.toggleAIPanel);

  const activeTabId = useEditorStore((s) => s.activeTabId);
  const closeTab = useEditorStore((s) => s.closeTab);
  const openTabs = useEditorStore((s) => s.openTabs);
  const saveTab = useEditorStore((s) => s.saveTab);

  // Cursor position for status bar
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorLine(line);
    setCursorColumn(column);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;

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
  }, [toggleSidebar, toggleAIPanel, activeTabId, closeTab, openTabs, saveTab]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-0">
      {/* Main Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <div
          className="shrink-0 panel-transition overflow-hidden"
          style={{ width: sidebarOpen ? `${sidebarWidth}px` : '40px' }}
        >
          <Sidebar />
        </div>

        {/* Editor (flex-grow center) */}
        <EditorArea onCursorChange={handleCursorChange} />

        {/* AI Panel */}
        <div
          className="shrink-0 panel-transition overflow-hidden"
          style={{ width: aiPanelOpen ? `${aiPanelWidth}px` : '40px' }}
        >
          <AIPanel />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar cursorLine={cursorLine} cursorColumn={cursorColumn} />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
