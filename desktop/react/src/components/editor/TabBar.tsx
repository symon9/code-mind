import React, { useCallback } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { getFileIcon } from '../../utils/fileIcons';

// ─── Component ────────────────────────────────────────────────────────────────

export const TabBar: React.FC = () => {
  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const closeAllTabs = useEditorStore((s) => s.closeAllTabs);
  const createNewFile = useEditorStore((s) => s.createNewFile);

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
    <div className="flex items-center justify-between bg-[#0e121c] border-b border-slate-800/80 shrink-0 h-9 select-none">
      {/* Scrollable Tab Items List */}
      <div className="flex items-center overflow-x-auto h-full scrollbar-none flex-1">
        {openTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const iconConfig = getFileIcon(tab.name, false);

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group relative flex items-center gap-2 px-3.5 h-full text-xs cursor-pointer
                border-r border-slate-800/60 shrink-0 max-w-[200px] min-w-[120px] transition-all duration-150
                ${
                  isActive
                    ? 'bg-[#141a28] text-slate-100 font-medium'
                    : 'bg-[#0d111a] text-slate-400 hover:bg-[#121826] hover:text-slate-200'
                }
              `}
            >
              {/* Active Tab Accent Bar */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm" />
              )}

              {/* Dirty Unsaved Dot */}
              {tab.isDirty ? (
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 animate-pulse" title="Unsaved changes" />
              ) : (
                <span
                  className="text-2xs font-bold font-mono shrink-0"
                  style={{ color: iconConfig.color }}
                >
                  {iconConfig.icon}
                </span>
              )}

              {/* File Name */}
              <span className="truncate font-mono text-[12px] flex-1" title={tab.path}>
                {tab.name}
              </span>

              {/* Close Button */}
              <span
                onClick={(e) => handleClose(e, tab.id)}
                className={`
                  ml-1 shrink-0 rounded p-0.5 transition-all duration-150
                  ${
                    isActive
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                      : 'opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white hover:bg-slate-700/60'
                  }
                `}
                title="Close Tab (Ctrl+W)"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </div>
          );
        })}
      </div>

      {/* Tab Bar Right Utility Controls */}
      <div className="flex items-center space-x-1 px-2 shrink-0 border-l border-slate-800/60 h-full">
        {/* + New Tab */}
        <button
          onClick={createNewFile}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="New File (Ctrl+N)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Close All Tabs */}
        {openTabs.length > 1 && (
          <button
            onClick={closeAllTabs}
            className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors text-[10px]"
            title="Close All Tabs"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 4H13M5 4V12.5C5 13 5.5 13.5 6 13.5H10C10.5 13.5 11 13 11 12.5V4M7 6.5V11M9 6.5V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
