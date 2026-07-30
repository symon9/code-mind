import React, { useCallback } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { getFileIcon } from '../../utils/fileIcons';

// ─── Component ────────────────────────────────────────────────────────────────

export const TabBar: React.FC = () => {
  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);

  const handleClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();

      const tab = openTabs.find((t) => t.id === tabId);
      if (tab?.isDirty) {
        const confirmed = window.confirm(
          `"${tab.name}" has unsaved changes. Close without saving?`
        );
        if (!confirmed) return;
      }

      closeTab(tabId);
    },
    [openTabs, closeTab]
  );

  if (openTabs.length === 0) return null;

  return (
    <div className="flex items-center bg-surface-100 border-b border-border overflow-x-auto shrink-0">
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const iconConfig = getFileIcon(tab.name, false);

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              group relative flex items-center gap-1.5 px-3 py-2 text-[13px]
              border-r border-border/50 shrink-0 min-w-0 max-w-[180px]
              transition-colors duration-100
              ${isActive
                ? 'bg-surface-0 text-text-primary'
                : 'bg-surface-100 text-text-secondary hover:bg-surface-200 hover:text-text-primary'
              }
            `}
          >
            {/* Active tab accent bar */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
            )}

            {/* Dirty indicator */}
            {tab.isDirty && (
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" title="Unsaved changes" />
            )}

            {/* File icon */}
            <span
              className="text-2xs font-bold font-mono shrink-0"
              style={{ color: iconConfig.color }}
            >
              {iconConfig.icon}
            </span>

            {/* File name */}
            <span className="truncate font-mono text-[13px]">
              {tab.name}
            </span>

            {/* Close button */}
            <span
              onClick={(e) => handleClose(e, tab.id)}
              className={`
                ml-1 shrink-0 rounded p-0.5
                transition-colors duration-100
                ${isActive
                  ? 'text-text-muted hover:text-text-primary hover:bg-surface-300'
                  : 'text-transparent group-hover:text-text-muted hover:!text-text-primary hover:bg-surface-300'
                }
              `}
              title="Close"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
};
