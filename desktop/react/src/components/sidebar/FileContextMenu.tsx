import React from 'react';
import type { ContextMenuAction, ContextMenuPosition } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FileContextMenuProps {
  position: ContextMenuPosition;
  actions: ContextMenuAction[];
  onAction: (action: string) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  position,
  actions,
  onAction,
  onClose,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="context-menu-backdrop"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Menu */}
      <div
        className="fixed z-[60] min-w-[160px] rounded-lg bg-surface-200 border border-border-light shadow-xl shadow-black/40 py-1 animate-fade-in"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {actions.map((item, index) => (
          <React.Fragment key={item.action}>
            {item.separator && index > 0 && (
              <div className="my-1 border-t border-border" />
            )}
            <button
              onClick={() => {
                onAction(item.action);
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-text-primary hover:bg-accent/20 hover:text-accent-light transition-colors text-left"
            >
              {item.icon && (
                <span className="text-xs w-4 text-center text-text-secondary">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};
