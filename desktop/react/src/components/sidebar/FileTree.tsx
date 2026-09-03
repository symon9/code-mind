import React, { useState, useCallback } from 'react';
import type { FileNode, ContextMenuPosition, ContextMenuAction } from '../../types';
import { useFileTreeStore } from '../../stores/useFileTreeStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { FileTreeNode } from './FileTreeNode';
import { FileContextMenu } from './FileContextMenu';

// ─── Context Menu Actions ─────────────────────────────────────────────────────

const fileActions: ContextMenuAction[] = [
  { label: 'Open File', action: 'open', icon: '📄' },
  { label: 'Rename', action: 'rename', icon: '✏️', separator: true },
  { label: 'Delete', action: 'delete', icon: '🗑️' },
];

const folderActions: ContextMenuAction[] = [
  { label: 'Open Folder', action: 'open', icon: '📂' },
  { label: 'Rename', action: 'rename', icon: '✏️', separator: true },
  { label: 'Delete', action: 'delete', icon: '🗑️' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const FileTree: React.FC = () => {
  const fileTree = useFileTreeStore((s) => s.fileTree);
  const isLoading = useFileTreeStore((s) => s.isLoading);
  const openFolder = useFileTreeStore((s) => s.openFolder);
  const openFile = useEditorStore((s) => s.openFile);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    node: FileNode;
  } | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileNode) => {
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        node,
      });
    },
    []
  );

  const handleContextAction = useCallback(
    (action: string) => {
      if (!contextMenu) return;

      switch (action) {
        case 'open':
          if (contextMenu.node.type === 'file') {
            openFile(contextMenu.node.path);
          }
          break;
        case 'rename':
          alert(`Rename: "${contextMenu.node.name}"`);
          break;
        case 'delete':
          alert(`Delete: "${contextMenu.node.name}"`);
          break;
      }
      setContextMenu(null);
    },
    [contextMenu, openFile]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-[#0e121b]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading workspace…</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (fileTree.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0e121b] select-none text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
            <path d="M2 4V12C2 12.5523 2.44772 13 3 13H13C13.5523 13 14 12.5523 14 12V6C14 5.44772 13.5523 5 13 5H8L6.5 3H3C2.44772 3 2 3.44772 2 4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
          No workspace folder open.
        </p>
        <button
          onClick={openFolder}
          className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors"
        >
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto py-1.5 scrollbar-thin bg-[#0e121b]">
        {fileTree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            depth={0}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <FileContextMenu
          position={contextMenu.position}
          actions={contextMenu.node.type === 'folder' ? folderActions : fileActions}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};
