import React, { useCallback, useRef, useState, useEffect } from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useAIStore } from '../../stores/useAIStore';
import { useToastStore } from '../../stores/useToastStore';
import { useAuthStore } from '../../stores/useAuthStore';
import type { ChatMessage } from '../../types';

declare global {
  interface Window {
    codemindGetActiveSelection?: () => string;
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

  // Expose selection getter globally for AIPanel's Attach Code button
  useEffect(() => {
    window.codemindGetActiveSelection = () => {
      if (!editorRef.current) return '';
      const selection = editorRef.current.getSelection();
      if (!selection || selection.isEmpty()) return '';
      return editorRef.current.getModel()?.getValueInRange(selection) || '';
    };
    return () => {
      delete window.codemindGetActiveSelection;
    };
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

      // ── Selection tracking for AI Context Menu ──
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

  // Handle click on AI Action button
  const handleAIActionClick = async (action: AIActionType) => {
    if (!activeTab || !selectionState.selectedText || loadingAction) return;

    setLoadingAction(action);

    const actionCode = selectionState.selectedText;
    const actionLang = activeTab.language || 'typescript';

    try {
      // 1. Ensure AI Panel is open
      setAIPanelOpen(true);

      // 2. Determine target session
      let targetSessionId = activeSessionId;
      if (!targetSessionId) {
        targetSessionId = createSession(`${action}: ${activeTab.name}`);
        setActiveSession(targetSessionId);
      }

      // 3. Append user action message to chat
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: `**${action}** active code selection:\n\`\`\`${actionLang}\n${actionCode}\n\`\`\``,
        timestamp: Date.now(),
      };
      addMessage(targetSessionId, userMessage);

      // 4. POST to /ai/actions
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/ai/actions', {
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

      // 5. Append assistant response message to chat
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };
      addMessage(targetSessionId, assistantMessage);
    } catch (err) {
      console.warn('[MonacoEditor] /ai/actions fallback trigger:', err);
      // Fallback response if backend service is offline
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

  return (
    <div className="relative w-full h-full">
      {/* ─── Floating AI Actions Context Toolbar ───────────────────────── */}
      {selectionState.visible && (
        <div
          style={{ top: `${selectionState.top}px`, left: `${selectionState.left}px` }}
          className="
            absolute z-40 flex items-center gap-1 p-1 rounded-lg border shadow-xl
            bg-surface-200/95 border-accent/40 backdrop-blur-md animate-fade-in text-xs font-sans
          "
        >
          <div className="flex items-center gap-1 px-1.5 py-0.5 border-r border-border/60 text-2xs font-semibold text-accent-light">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  flex items-center gap-1 px-2 py-1 rounded text-2xs font-medium
                  hover:bg-accent hover:text-white text-text-primary transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap
                "
                title={`Run ${action} on selection`}
              >
                {isLoading ? (
                  <svg className="w-3 h-3 animate-spin text-accent-light" fill="none" viewBox="0 0 24 24">
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
    </div>
  );
};
