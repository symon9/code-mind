import React, { useCallback } from 'react';
import type { FileNode } from '../../types';
import { getFileIcon } from '../../utils/fileIcons';
import { useFileTreeStore } from '../../stores/useFileTreeStore';
import { useEditorStore } from '../../stores/useEditorStore';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  depth,
  onContextMenu,
}) => {
  const expandedFolders = useFileTreeStore((s) => s.expandedFolders);
  const toggleFolder = useFileTreeStore((s) => s.toggleFolder);
  const openFile = useEditorStore((s) => s.openFile);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const openTabs = useEditorStore((s) => s.openTabs);

  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.path);
  const iconConfig = getFileIcon(node.name, isFolder);

  // Check if this file is the active tab
  const normalizedNodePath = node.path.replace(/\\/g, '/');
  const isActive = !isFolder && openTabs.some(
    (tab) => (tab.path === node.path || tab.path.replace(/\\/g, '/') === normalizedNodePath) && tab.id === activeTabId
  );

  const handleClick = useCallback(() => {
    if (isFolder) {
      toggleFolder(node.path);
    } else {
      openFile(node.path);
    }
  }, [isFolder, node.path, toggleFolder, openFile]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, node);
    },
    [node, onContextMenu]
  );

  return (
    <div>
      {/* Node Row */}
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          w-full flex items-center gap-1.5 py-[3px] pr-3 text-[13px] rounded-md
          transition-colors duration-100 cursor-pointer group
          ${isActive
            ? 'bg-accent/15 text-accent-light'
            : 'text-text-secondary hover:bg-surface-400/50 hover:text-text-primary'
          }
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Chevron (folders only) */}
        {isFolder ? (
          <span
            className={`
              inline-flex items-center justify-center w-4 h-4 text-[10px]
              text-text-muted transition-transform duration-150
              ${isExpanded ? 'rotate-90' : 'rotate-0'}
            `}
          >
            ▶
          </span>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        {isFolder ? (
          <span className="text-sm" style={{ color: iconConfig.color }}>
            {isExpanded ? '📂' : '📁'}
          </span>
        ) : (
          <span
            className="text-2xs font-bold font-mono w-5 text-center shrink-0 rounded-sm"
            style={{ color: iconConfig.color }}
          >
            {iconConfig.icon}
          </span>
        )}

        {/* Name */}
        <span className="truncate font-mono text-[13px]">{node.name}</span>
      </button>

      {/* Children (if folder is expanded) */}
      {isFolder && isExpanded && node.children && (
        <div className="animate-fade-in">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};
