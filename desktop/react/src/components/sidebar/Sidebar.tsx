import React from 'react';
import { useFileTreeStore } from '../../stores/useFileTreeStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { FileTree } from './FileTree';

// ─── Component ────────────────────────────────────────────────────────────────

export const Sidebar: React.FC = () => {
  const rootPath = useFileTreeStore((s) => s.rootPath);
  const openFolder = useFileTreeStore((s) => s.openFolder);
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);

  // Extract folder name from path
  const folderName = rootPath
    ? rootPath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || rootPath
    : null;

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-3 bg-surface-100 border-r border-border w-10">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-surface-400/50 text-text-muted hover:text-text-primary transition-colors"
          title="Open Sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className="flex flex-col bg-surface-100 border-r border-border animate-slide-in-left h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          Explorer
        </h2>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-surface-400/50 text-text-muted hover:text-text-primary transition-colors"
          title="Close Sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Open Folder Button */}
      <div className="px-3 py-2 border-b border-border/50">
        <button
          onClick={openFolder}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md
                     bg-accent/10 border border-accent/25 text-accent-light
                     hover:bg-accent/20 hover:border-accent/40 transition-all duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 4V12C2 12.5523 2.44772 13 3 13H13C13.5523 13 14 12.5523 14 12V6C14 5.44772 13.5523 5 13 5H8L6.5 3H3C2.44772 3 2 3.44772 2 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M8 7V11M6 9H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Open Folder
        </button>
      </div>

      {/* Current Folder Label */}
      {folderName && (
        <div className="px-3 py-1.5 border-b border-border/30">
          <span className="text-[11px] font-mono text-text-muted truncate block" title={rootPath || ''}>
            {folderName}
          </span>
        </div>
      )}

      {/* File Tree */}
      <FileTree />
    </aside>
  );
};
