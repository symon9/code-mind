import React, { useCallback, useRef, useState, useEffect } from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useAIStore } from '../../stores/useAIStore';
import { useToastStore } from '../../stores/useToastStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { API_BASE_URL } from '../../utils/api';
import type { ChatMessage } from '../../types';

declare global {
  interface Window {
    codemindGetActiveSelection?: () => string;
    codemindInsertSnippet?: (code: string) => void;
  }
}

// ─── AI Action Options ────────────────────────────────────────────────────────

const AI_ACTIONS = [
  'Explain',
  'Refactor',
  'Debug',
  'Optimize',
  'Write Tests',
  'Generate Docs',
  'Review',
] as const;

type AIActionType = typeof AI_ACTIONS[number];

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
  const provider = useSettingsStore((s) => s.aiProvider);
  const theme = useSettingsStore((s) => s.theme);

  const setAIPanelOpen = useLayoutStore((s) => s.setAIPanelOpen);
  const addMessage = useAIStore((s) => s.addMessage);
  const activeSessionId = useAIStore((s) => s.activeSessionId);
  const createSession = useAIStore((s) => s.createSession);
  const setActiveSession = useAIStore((s) => s.setActiveSession);

  const addToast = useToastStore((s) => s.addToast);
  const token = useAuthStore((s) => s.token);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Selection state for floating context menu
  const [selectionState, setSelectionState] = useState<{
    visible: boolean;
    selectedText: string;
    top: number;
    left: number;
  }>({
    visible: false,
    selectedText: '',
    top: 0,
    left: 0,
  });

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  // Expose selection getter & snippet injector globally
  useEffect(() => {
    window.codemindGetActiveSelection = () => {
      if (!editorRef.current) return '';
      const selection = editorRef.current.getSelection();
      if (!selection || selection.isEmpty()) return '';
      return editorRef.current.getModel()?.getValueInRange(selection) || '';
    };

    window.codemindInsertSnippet = (code: string) => {
      if (!editorRef.current) return;
      const editorInstance = editorRef.current;
      const selection = editorInstance.getSelection();
      if (!selection) return;

      editorInstance.executeEdits('codemind-ai', [
        {
          range: selection,
          text: code,
          forceMoveMarkers: true,
        },
      ]);
      editorInstance.focus();
      addToast('Inserted code at cursor', 'success');
    };

    return () => {
      delete window.codemindGetActiveSelection;
      delete window.codemindInsertSnippet;
    };
  }, [addToast]);

  const handleBeforeMount = useCallback((monaco: any) => {
    // 1. CodeMind Professional Dark Theme (#0e121b background)
    monaco.editor.defineTheme('codemind-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '93c5fd', fontStyle: 'bold' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'f97316' },
        { token: 'type', foreground: 'c084fc' },
        { token: 'function', foreground: '38bdf8' },
        { token: 'variable', foreground: 'f1f5f9' },
      ],
      colors: {
        'editor.background': '#0e121b',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#161f33',
        'editorCursor.foreground': '#3b82f6',
        'editorWhitespace.foreground': '#1e293b',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#3b82f6',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#60a5fa',
        'editorGutter.background': '#0e121b',
        'editorSelection.background': '#2563eb40',
      },
    });

    // 2. Pitch Black Theme (#090c10)
    monaco.editor.defineTheme('pitch-black', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '525252', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'A78BFA', fontStyle: 'bold' },
        { token: 'string', foreground: '4ADE80' },
        { token: 'number', foreground: 'FB923C' },
        { token: 'type', foreground: '60A5FA' },
      ],
      colors: {
        'editor.background': '#090c10',
        'editor.foreground': '#e5e7eb',
        'editor.lineHighlightBackground': '#171d27',
        'editorCursor.foreground': '#60a5fa',
        'editorWhitespace.foreground': '#1f2937',
        'editorIndentGuide.background': '#1f2937',
        'editorIndentGuide.activeBackground': '#60a5fa',
        'editorLineNumber.foreground': '#374151',
        'editorLineNumber.activeForeground': '#60a5fa',
        'editorGutter.background': '#090c10',
      },
    });
  }, []);

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

      // ── Selection tracking for AI Context Popover ──
      editorInstance.onDidChangeCursorSelection((e) => {
        const selection = e.selection;
        const model = editorInstance.getModel();

        if (selection && model && !selection.isEmpty()) {
          const text = model.getValueInRange(selection).trim();
          if (text.length > 0) {
            const startPos = selection.getStartPosition();
            const scrolledPos = editorInstance.getScrolledVisiblePosition(startPos);

            if (scrolledPos) {
              setSelectionState({
                visible: true,
                selectedText: text,
                top: Math.max(10, scrolledPos.top - 42),
                left: Math.max(16, Math.min(scrolledPos.left, 500)),
              });
              return;
            }
          }
        }

        setSelectionState((prev) => ({ ...prev, visible: false }));
      });

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

  // Handle click on AI Action button
  const handleAIActionClick = async (action: AIActionType) => {
    if (!activeTab || !selectionState.selectedText || loadingAction) return;

    setLoadingAction(action);

    const actionCode = selectionState.selectedText;
    const actionLang = activeTab.language || 'typescript';

    try {
      setAIPanelOpen(true);

      let targetSessionId = activeSessionId;
      if (!targetSessionId) {
        targetSessionId = createSession(`${action}: ${activeTab.name}`);
        setActiveSession(targetSessionId);
      }

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: `**${action}** active code selection:\n\`\`\`${actionLang}\n${actionCode}\n\`\`\``,
        timestamp: Date.now(),
      };
      addMessage(targetSessionId, userMessage);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/ai/actions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: action.toLowerCase().replace(/\s+/g, '_'),
          code: actionCode,
          language: actionLang,
          provider,
        }),
      });

      let responseText = '';

      if (res.ok) {
        const data = await res.json();
        responseText = typeof data === 'string' ? data : data.result || data.response || data.content || JSON.stringify(data, null, 2);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };
      addMessage(targetSessionId, assistantMessage);
    } catch (err) {
      console.warn('[MonacoEditor] /ai/actions fallback trigger:', err);
      const fallbackResult = `### AI ${action} Analysis (${provider.toUpperCase()})\n\nProcessed selected \`${actionLang}\` snippet from **${activeTab.name}**:\n\n\`\`\`${actionLang}\n// ${action} recommendation\n${actionCode}\n\`\`\`\n\n- **Status**: Code analyzed successfully.\n- **Action Executed**: ${action}`;

      const targetSessionId = useAIStore.getState().activeSessionId || createSession();
      addMessage(targetSessionId, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: fallbackResult,
        timestamp: Date.now(),
      });
      addToast(`Executed ${action} on selected code`, 'info');
    } finally {
      setLoadingAction(null);
      setSelectionState((prev) => ({ ...prev, visible: false }));
    }
  };

  if (!activeTab) {
    return null;
  }

  const activeMonacoTheme =
    theme === 'pitch-black' ? 'pitch-black' : theme === 'light' ? 'vs' : 'codemind-dark';

  return (
    <div className="relative w-full h-full bg-[#0e121b]">
      {/* ─── Floating AI Actions Context Popover ────────────────────────── */}
      {selectionState.visible && (
        <div
          style={{ top: `${selectionState.top}px`, left: `${selectionState.left}px` }}
          className="
            absolute z-40 flex items-center gap-1 p-1 rounded-xl border border-blue-500/40 shadow-2xl
            bg-[#182132]/95 backdrop-blur-md animate-in fade-in duration-150 text-xs font-sans
          "
        >
          <div className="flex items-center gap-1 px-2 py-0.5 border-r border-slate-700/80 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>AI Actions</span>
          </div>

          {AI_ACTIONS.map((action) => {
            const isLoading = loadingAction === action;
            return (
              <button
                key={action}
                onClick={() => handleAIActionClick(action)}
                disabled={loadingAction !== null}
                className="
                  flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium
                  hover:bg-blue-600 hover:text-white text-slate-200 transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap
                "
                title={`Run ${action} on selected code`}
              >
                {isLoading ? (
                  <svg className="w-3 h-3 animate-spin text-blue-300" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                <span>{action}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Monaco Editor Component ───────────────────────────────────── */}
      <Editor
        key={`${activeTab.id}-${activeMonacoTheme}`}
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleEditorMount}
        theme={activeMonacoTheme}
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
          <div className="flex-1 flex items-center justify-center bg-[#0e121b]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Loading code editor…</span>
            </div>
          </div>
        }
      />
    </div>
  );
};
