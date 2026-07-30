import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { TabBar } from './TabBar';
import { MonacoEditor } from './MonacoEditor';

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditorAreaProps {
  onCursorChange?: (line: number, column: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EditorArea: React.FC<EditorAreaProps> = ({ onCursorChange }) => {
  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const hasActiveTabs = openTabs.length > 0 && activeTabId !== null;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface-0">
      {/* Tab Bar */}
      <TabBar />

      {/* Editor or Empty State */}
      {hasActiveTabs ? (
        <div className="flex-1 min-h-0">
          <MonacoEditor onCursorChange={onCursorChange} />
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-surface-0">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        {/* Logo / Brand Mark */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-dark/10 border border-accent/20 flex items-center justify-center glow-accent">
            <span className="text-3xl font-bold bg-gradient-to-br from-accent-light to-accent bg-clip-text text-transparent">
              CM
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent/30 border border-accent/40 flex items-center justify-center">
            <span className="text-[10px] text-accent-light">✦</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            CodeMind
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Open a file from the sidebar or use{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-surface-300 border border-border text-text-muted text-xs font-mono">
              Ctrl+O
            </kbd>{' '}
            to get started.
          </p>
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-300 border border-border font-mono">Ctrl+S</kbd>
            <span>Save</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-300 border border-border font-mono">Ctrl+W</kbd>
            <span>Close Tab</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-300 border border-border font-mono">Ctrl+B</kbd>
            <span>Sidebar</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-300 border border-border font-mono">Ctrl+J</kbd>
            <span>AI Panel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
