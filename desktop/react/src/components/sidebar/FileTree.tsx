import React, { useState, useCallback } from 'react';
import type { FileNode, ContextMenuPosition, ContextMenuAction } from '../../types';
import { useFileTreeStore } from '../../stores/useFileTreeStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { FileTreeNode } from './FileTreeNode';
import { FileContextMenu } from './FileContextMenu';

// ─── Context Menu Actions ─────────────────────────────────────────────────────

const fileActions: ContextMenuAction[] = [
  { label: 'Open', action: 'open', icon: '📄' },
  { label: 'Rename', action: 'rename', icon: '✏️', separator: true },
  { label: 'Delete', action: 'delete', icon: '🗑️' },
];

const folderActions: ContextMenuAction[] = [
  { label: 'Open', action: 'open', icon: '📂' },
  { label: 'Rename', action: 'rename', icon: '✏️', separator: true },
  { label: 'Delete', action: 'delete', icon: '🗑️' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const FileTree: React.FC = () => {
  const fileTree = useFileTreeStore((s) => s.fileTree);
  const isLoading = useFileTreeStore((s) => s.isLoading);
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
          // UI-only placeholder — IPC not wired yet
          alert(`Rename: "${contextMenu.node.name}" — Feature coming soon`);
          break;
        case 'delete':
          // UI-only placeholder — IPC not wired yet
          alert(`Delete: "${contextMenu.node.name}" — Feature coming soon`);
          break;
      }
      setContextMenu(null);
    },
    [contextMenu, openFile]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-xs text-text-muted">Loading files…</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (fileTree.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-xs text-text-muted text-center leading-relaxed">
          No folder open.
          <br />
          Click <span className="text-accent-light font-medium">Open Folder</span> above to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto py-1">
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
