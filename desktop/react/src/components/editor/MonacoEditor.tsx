import React, { useCallback, useRef } from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MonacoEditorProps {
  onCursorChange?: (line: number, column: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MonacoEditor: React.FC<MonacoEditorProps> = ({ onCursorChange }) => {
  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const updateContent = useEditorStore((s) => s.updateContent);
  const saveTab = useEditorStore((s) => s.saveTab);

  const fontSize = useSettingsStore((s) => s.fontSize);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const wordWrap = useSettingsStore((s) => s.wordWrap);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  const handleEditorMount: OnMount = useCallback(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance;

      // ── Keybinding: Ctrl+S / Cmd+S ──
      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          const currentActiveId = useEditorStore.getState().activeTabId;
          if (currentActiveId) {
            saveTab(currentActiveId);
          }
        }
      );

      // ── Cursor position tracking ──
      editorInstance.onDidChangeCursorPosition((e) => {
        if (onCursorChange) {
          onCursorChange(e.position.lineNumber, e.position.column);
        }
      });

      // Focus the editor
      editorInstance.focus();
    },
    [saveTab, onCursorChange]
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      if (activeTabId && value !== undefined) {
        updateContent(activeTabId, value);
      }
    },
    [activeTabId, updateContent]
  );

  if (!activeTab) {
    return null;
  }

  return (
    <Editor
      key={activeTab.id}
      height="100%"
      language={activeTab.language}
      value={activeTab.content}
      onChange={handleChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={{
        fontSize,
        fontFamily,
        wordWrap,
        minimap: { enabled: true, scale: 2, showSlider: 'mouseover' },
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          useShadows: false,
        },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderLineHighlight: 'all',
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        links: true,
        contextmenu: true,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        tabSize: 2,
        detectIndentation: true,
        renderWhitespace: 'selection',
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
      }}
      loading={
        <div className="flex-1 flex items-center justify-center bg-surface-0">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-xs text-text-muted">Loading editor…</span>
          </div>
        </div>
      }
    />
  );
};
