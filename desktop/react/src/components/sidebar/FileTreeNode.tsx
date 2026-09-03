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
  const isActive =
    !isFolder &&
    openTabs.some(
      (tab) =>
        (tab.path === node.path || tab.path.replace(/\\/g, '/') === normalizedNodePath) &&
        tab.id === activeTabId
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
      {/* Node Item Row */}
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          w-full flex items-center gap-1.5 py-[3.5px] pr-2.5 text-[12.5px] font-mono text-left
          transition-colors duration-100 cursor-pointer group relative select-none
          ${
            isActive
              ? 'bg-blue-600/20 text-blue-300 font-semibold border-l-2 border-blue-500'
              : 'text-slate-400 hover:bg-[#151b28] hover:text-slate-100 border-l-2 border-transparent'
          }
        `}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
      >
        {/* Chevron indicator (Folders only) */}
        {isFolder ? (
          <span
            className={`
              inline-flex items-center justify-center w-3.5 h-3.5 text-slate-500
              transition-transform duration-150 shrink-0
              ${isExpanded ? 'rotate-90 text-slate-300' : 'rotate-0'}
            `}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* File / Folder Icon */}
        {isFolder ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-amber-400 shrink-0">
            <path
              d="M2 4V12C2 12.5523 2.44772 13 3 13H13C13.5523 13 14 12.5523 14 12V6C14 5.44772 13.5523 5 13 5H8L6.5 3H3C2.44772 3 2 3.44772 2 4Z"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span
            className="text-[10px] font-bold font-mono w-4 text-center shrink-0"
            style={{ color: iconConfig.color }}
          >
            {iconConfig.icon}
          </span>
        )}

        {/* File / Folder Name */}
        <span className="truncate flex-1 tracking-tight" title={node.name}>
          {node.name}
        </span>
      </button>

      {/* Children Nodes (When folder is expanded) */}
      {isFolder && isExpanded && node.children && (
        <div className="animate-in fade-in duration-100">
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
