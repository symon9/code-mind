import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getLanguageDisplayName } from '../../utils/languageMap';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatusBarProps {
  cursorLine: number;
  cursorColumn: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StatusBar: React.FC<StatusBarProps> = ({
  cursorLine,
  cursorColumn,
}) => {
  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const aiProvider = useSettingsStore((s) => s.aiProvider);

  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  return (
    <footer className="flex items-center justify-between px-4 py-[5px] bg-surface-100 border-t border-border text-xs font-mono shrink-0 select-none">
      {/* Left section */}
      <div className="flex items-center gap-4 text-text-muted">
        {activeTab ? (
          <>
            {/* File name */}
            <span className="text-text-secondary" title={activeTab.path}>
              {activeTab.name}
              {activeTab.isDirty && (
                <span className="text-accent ml-1">●</span>
              )}
            </span>

            {/* Separator */}
            <span className="text-border">│</span>

            {/* Language */}
            <span>{getLanguageDisplayName(activeTab.language)}</span>

            {/* Separator */}
            <span className="text-border">│</span>

            {/* Cursor Position */}
            <span>
              Ln {cursorLine}, Col {cursorColumn}
            </span>

            {/* Separator */}
            <span className="text-border">│</span>

            {/* Encoding */}
            <span>UTF-8</span>
          </>
        ) : (
          <span>No file open</span>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 text-text-muted">
        {/* AI Provider */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
          <span className="text-text-secondary capitalize">{aiProvider}</span>
        </div>

        {/* Brand */}
        <span className="text-border">│</span>
        <span className="text-accent/70 font-semibold tracking-wider">
          CodeMind
        </span>
      </div>
    </footer>
  );
};
