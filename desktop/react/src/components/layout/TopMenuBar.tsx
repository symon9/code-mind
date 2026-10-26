import React, { useState, useRef, useEffect } from 'react';
import { useFileTreeStore } from '../../stores/useFileTreeStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useAuthStore } from '../../stores/useAuthStore';
import logoImg from '../../assets/logo';

export const TopMenuBar: React.FC = () => {
  const rootPath = useFileTreeStore((s) => s.rootPath);
  const openFolder = useFileTreeStore((s) => s.openFolder);
  const closeFolder = useFileTreeStore((s) => s.closeFolder);

  const createNewFile = useEditorStore((s) => s.createNewFile);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const closeTab = useEditorStore((s) => s.closeTab);
  const saveTab = useEditorStore((s) => s.saveTab);

  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const aiPanelOpen = useLayoutStore((s) => s.aiPanelOpen);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const toggleAIPanel = useLayoutStore((s) => s.toggleAIPanel);
  const openSettings = useLayoutStore((s) => s.openSettings);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setCurrentView = useAuthStore((s) => s.setCurrentView);

  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'view' | 'help' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const folderName = rootPath
    ? rootPath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || rootPath
    : null;

  return (
    <header
      ref={menuRef}
      className="h-9 bg-[#111622] border-b border-slate-800/80 flex items-center justify-between px-3 text-xs select-none shrink-0 z-30 relative backdrop-blur-md drag-region"
    >
      {/* Left section: App Brand + Menus */}
      <div className="flex items-center gap-2 no-drag">
        {/* Brand Badge */}
        <div className="flex items-center gap-2 mr-3 group cursor-pointer" onClick={() => openSettings('appearance')}>
          <img
            src={logoImg}
            alt="CodeMind Logo"
            className="w-5 h-5 rounded-md object-contain group-hover:scale-105 transition-transform shadow-md shadow-purple-500/20"
          />
          <span className="font-bold text-white tracking-wide text-xs group-hover:text-blue-400 transition-colors">
            CodeMind
          </span>
        </div>

        {/* Menu Bar Buttons */}
        <nav className="flex items-center space-x-0.5">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-xs ${
                activeMenu === 'file' ? 'bg-slate-800 text-white shadow-sm' : ''
              }`}
            >
              File
            </button>

            {activeMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#181f2e] border border-slate-700/80 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-200">
                <MenuItem
                  label="New File"
                  shortcut="Ctrl+N"
                  onClick={() => {
                    createNewFile();
                    setActiveMenu(null);
                  }}
                />
                <MenuItem
                  label="Open Folder..."
                  shortcut="Ctrl+O"
                  onClick={() => {
                    openFolder();
                    setActiveMenu(null);
                  }}
                />
                <MenuItem
                  label="Close Folder"
                  disabled={!rootPath}
                  onClick={() => {
                    closeFolder();
                    setActiveMenu(null);
                  }}
                />

                <div className="my-1.5 border-t border-slate-700/50" />

                <MenuItem
                  label="Save File"
                  shortcut="Ctrl+S"
                  disabled={!activeTabId}
                  onClick={() => {
                    if (activeTabId) saveTab(activeTabId);
                    setActiveMenu(null);
                  }}
                />
                <MenuItem
                  label="Close Tab"
                  shortcut="Ctrl+W"
                  disabled={!activeTabId}
                  onClick={() => {
                    if (activeTabId) closeTab(activeTabId);
                    setActiveMenu(null);
                  }}
                />

                <div className="my-1.5 border-t border-slate-700/50" />

                <MenuItem
                  label="Preferences / Settings"
                  shortcut="Ctrl+,"
                  onClick={() => {
                    openSettings();
                    setActiveMenu(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={`px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-xs ${
                activeMenu === 'edit' ? 'bg-slate-800 text-white shadow-sm' : ''
              }`}
            >
              Edit
            </button>

            {activeMenu === 'edit' && (
              <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#181f2e] border border-slate-700/80 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-200">
                <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={() => setActiveMenu(null)} />
                <MenuItem label="Redo" shortcut="Ctrl+Y" onClick={() => setActiveMenu(null)} />
                <div className="my-1.5 border-t border-slate-700/50" />
                <MenuItem label="Cut" shortcut="Ctrl+X" onClick={() => setActiveMenu(null)} />
                <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => setActiveMenu(null)} />
                <MenuItem label="Paste" shortcut="Ctrl+V" onClick={() => setActiveMenu(null)} />
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              className={`px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-xs ${
                activeMenu === 'view' ? 'bg-slate-800 text-white shadow-sm' : ''
              }`}
            >
              View
            </button>

            {activeMenu === 'view' && (
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#181f2e] border border-slate-700/80 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-200">
                <MenuItem
                  label="Toggle Explorer Sidebar"
                  shortcut="Ctrl+B"
                  onClick={() => {
                    toggleSidebar();
                    setActiveMenu(null);
                  }}
                />
                <MenuItem
                  label="Toggle AI Assistant Panel"
                  shortcut="Ctrl+J"
                  onClick={() => {
                    toggleAIPanel();
                    setActiveMenu(null);
                  }}
                />
                <div className="my-1.5 border-t border-slate-700/50" />
                <MenuItem
                  label="Settings & Shortcuts"
                  shortcut="Ctrl+,"
                  onClick={() => {
                    openSettings();
                    setActiveMenu(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              className={`px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all font-medium text-xs ${
                activeMenu === 'help' ? 'bg-slate-800 text-white shadow-sm' : ''
              }`}
            >
              Help
            </button>

            {activeMenu === 'help' && (
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#181f2e] border border-slate-700/80 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-200">
                <MenuItem
                  label="Keyboard Shortcuts"
                  onClick={() => {
                    openSettings('shortcuts');
                    setActiveMenu(null);
                  }}
                />
                <MenuItem
                  label="AI Provider Settings"
                  onClick={() => {
                    openSettings('ai');
                    setActiveMenu(null);
                  }}
                />
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Center section: Workspace Search / Command Bar */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center no-drag">
        <button
          onClick={() => openSettings('shortcuts')}
          className="flex items-center gap-2 px-3 py-1 bg-[#182030] hover:bg-[#20293d] border border-slate-700/60 rounded-md text-xs text-slate-300 hover:text-white transition-all shadow-inner max-w-sm shrink truncate"
          title="Search files or commands"
        >
          <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="truncate font-medium">
            {folderName ? `${folderName}` : 'CodeMind Workspace'}
          </span>
          <span className="ml-2 text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Right section: Sidebar Toggles & Profile */}
      <div className="flex items-center gap-1.5 no-drag pr-36">
        {/* Toggle Left Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded-md transition-colors ${
            sidebarOpen ? 'text-blue-400 bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Toggle Explorer Sidebar (Ctrl+B)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 2V14" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        {/* Toggle AI Panel Button */}
        <button
          onClick={toggleAIPanel}
          className={`p-1.5 rounded-md transition-colors ${
            aiPanelOpen ? 'text-indigo-400 bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
          title="Toggle AI Assistant (Ctrl+J)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 2V14" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Profile / Sign In */}
        {isAuthenticated ? (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/60 text-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-800 transition-colors"
            title={user?.email}
            onClick={() => openSettings('editor')}
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-[9px] font-bold text-white uppercase">
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <span className="truncate max-w-[100px] text-[11px]">
              {user?.name || user?.email?.split('@')[0]}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setCurrentView('login')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition-all"
          >
            Sign In
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => openSettings()}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
          title="Settings (Ctrl+,)"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M13.5 8C13.5 7.4 13.4 6.8 13.2 6.3L14.7 5.1L13.2 2.5L11.4 3.2C10.7 2.6 10 2.2 9.2 2L8.9 0.1H5.9L5.6 2C4.8 2.2 4.1 2.6 3.4 3.2L1.6 2.5L0.1 5.1L1.6 6.3C1.4 6.8 1.3 7.4 1.3 8C1.3 8.6 1.4 9.2 1.6 9.7L0.1 10.9L1.6 13.5L3.4 12.8C4.1 13.4 4.8 13.8 5.6 14L5.9 15.9H8.9L9.2 14C10 13.8 10.7 13.4 11.4 12.8L13.2 13.5L14.7 10.9L13.2 9.7C13.4 9.2 13.5 8.6 13.5 8Z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

// ─── Sub-component for Menu Items ─────────────────────────────────────────────

const MenuItem: React.FC<{
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, shortcut, disabled, onClick }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
      disabled
        ? 'text-slate-600 cursor-not-allowed'
        : 'text-slate-200 hover:bg-blue-600/20 hover:text-white font-medium'
    }`}
  >
    <span>{label}</span>
    {shortcut && (
      <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-slate-400 ml-4">
        {shortcut}
      </kbd>
    )}
  </button>
);
