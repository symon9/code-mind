import React from 'react';
import { useFileTreeStore } from '../../stores/useFileTreeStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { FileTree } from './FileTree';

// ─── Component ────────────────────────────────────────────────────────────────

export const Sidebar: React.FC = () => {
  const rootPath = useFileTreeStore((s) => s.rootPath);
  const openFolder = useFileTreeStore((s) => s.openFolder);
  const setExpandedFolders = useFileTreeStore((s) => s.setExpandedFolders);
  const handleCollapseAll = () => setExpandedFolders(new Set());

  const createNewFile = useEditorStore((s) => s.createNewFile);

  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);

  // Extract folder name from path
  const folderName = rootPath
    ? rootPath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || rootPath
    : null;

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 bg-[#0d121d] border-r border-slate-800 w-10 h-full select-none">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Open Explorer (Ctrl+B)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="mt-4 text-[10px] text-slate-500 font-semibold tracking-widest [writing-mode:vertical-lr] rotate-180">
          EXPLORER
        </span>
      </div>
    );
  }

  return (
    <aside className="flex flex-col bg-[#0e121b] border-r border-slate-800/90 h-full w-full select-none">
      {/* Explorer Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-[#121826] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
            Explorer
          </span>
        </div>

        {/* Quick Toolbar Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* New File */}
          <button
            onClick={createNewFile}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="New File (Ctrl+N)"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 2.5C3 1.94772 3.44772 1.5 4 1.5H9.5L13 5V13.5C13 14.0523 12.5523 14.5 12 14.5H4C3.44772 14.5 3 14.0523 3 13.5V2.5Z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 6V10M6 8H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Collapse All Folders */}
          {rootPath && (
            <button
              onClick={handleCollapseAll}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Collapse All Folders"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 13H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Close Sidebar Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Close Explorer (Ctrl+B)"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Open Folder CTA (Shown when NO folder is open) */}
      {!rootPath && (
        <div className="p-3 border-b border-slate-800/80 bg-[#121826]/40">
          <button
            onClick={openFolder}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg
                       bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20
                       transition-all duration-150 transform hover:-translate-y-0.5"
            title="Open Folder"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4V12C2 12.5523 2.44772 13 3 13H13C13.5523 13 14 12.5523 14 12V6C14 5.44772 13.5523 5 13 5H8L6.5 3H3C2.44772 3 2 3.44772 2 4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M8 7V11M6 9H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span>Open Folder</span>
          </button>
        </div>
      )}

      {/* Current Active Workspace Folder Badge */}
      {folderName && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 bg-[#141a27] text-slate-300 font-mono text-[11px] font-semibold tracking-wide overflow-hidden">
          <div className="flex items-center gap-2 truncate">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-blue-400 shrink-0">
              <path d="M2 4V12C2 12.5523 2.44772 13 3 13H13C13.5523 13 14 12.5523 14 12V6C14 5.44772 13.5523 5 13 5H8L6.5 3H3C2.44772 3 2 3.44772 2 4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
            <span className="truncate uppercase text-blue-300" title={rootPath || ''}>
              {folderName}
            </span>
          </div>
        </div>
      )}

      {/* File Tree Explorer View */}
      <FileTree />
    </aside>
  );
};
