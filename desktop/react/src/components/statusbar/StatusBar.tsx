import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToastStore } from '../../stores/useToastStore';
import { getLanguageDisplayName } from '../../utils/languageMap';
import { AIProviderSwitcher } from '../ai/AIProviderSwitcher';
import logoImg from '../../assets/logo';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatusBarProps {
  cursorLine: number;
  cursorColumn: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StatusBar: React.FC<StatusBarProps> = ({
  cursorLine,
  cursorColumn,
}) => {
  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const openSettings = useLayoutStore((s) => s.openSettings);
  const addToast = useToastStore((s) => s.addToast);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCurrentView = useAuthStore((s) => s.setCurrentView);
  const logout = useAuthStore((s) => s.logout);

  const activeTab = openTabs.find((tab) => tab.id === activeTabId);

  return (
    <footer className="h-6.5 bg-[#0f1420] border-t border-slate-800/80 flex items-center justify-between px-2.5 text-[11px] font-sans shrink-0 select-none text-slate-400 z-30">
      {/* Left section: Git, Problems, Position, File details */}
      <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none">
        {/* Git Branch */}
        <button
          onClick={() => addToast('Git branch: main', 'info')}
          className="flex items-center gap-1 hover:text-white hover:bg-slate-800/80 px-1.5 py-0.5 rounded transition-colors"
          title="Source Control (main branch)"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-blue-400">
            <path
              d="M11.5 5A2.5 2.5 0 109 2.5a2.5 2.5 0 002.5 2.5zM4.5 14A2.5 2.5 0 102 11.5 2.5 2.5 0 004.5 14zM4.5 7.5A2.5 2.5 0 102 5a2.5 2.5 0 002.5 2.5z"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path d="M4.5 7.5v4M9.5 4.5L5.8 8.2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="font-mono text-[10px] font-medium text-slate-300">main</span>
        </button>

        {/* Diagnostics / Problems */}
        <button
          onClick={() => addToast('No problems detected in workspace', 'success')}
          className="flex items-center gap-1.5 hover:text-white hover:bg-slate-800/80 px-1.5 py-0.5 rounded transition-colors"
          title="Errors and Warnings"
        >
          <span className="flex items-center gap-0.5 text-slate-400">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-red-400">
              <path d="M8 1L1 15h14L8 1z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 6v4M8 12v1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="font-mono text-[10px]">0</span>
          </span>
          <span className="flex items-center gap-0.5 text-slate-400">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-amber-400">
              <path d="M8 1.5A6.5 6.5 0 1014.5 8 6.5 6.5 0 008 1.5z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M8 5v4M8 11v1" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="font-mono text-[10px]">0</span>
          </span>
        </button>

        <span className="text-slate-800">│</span>

        {activeTab ? (
          <>
            {/* Active File Name & Dirty Status */}
            <div className="flex items-center gap-1 text-slate-200 font-medium truncate max-w-xs" title={activeTab.path}>
              <span className="truncate">{activeTab.name}</span>
              {activeTab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" title="Unsaved changes" />
              )}
            </div>

            <span className="text-slate-800">│</span>

            {/* Line & Column Position */}
            <button
              onClick={() => openSettings('shortcuts')}
              className="hover:text-white hover:bg-slate-800/80 px-1 py-0.5 rounded font-mono text-[10px] transition-colors"
              title="Go to Line/Column"
            >
              Ln {cursorLine}, Col {cursorColumn}
            </button>

            <span className="text-slate-800">│</span>

            {/* Indentation Spaces */}
            <span className="font-mono text-[10px]">Spaces: 2</span>

            <span className="text-slate-800">│</span>

            {/* Encoding & Line Endings */}
            <span className="font-mono text-[10px]">UTF-8</span>
            <span className="font-mono text-[10px]">LF</span>

            <span className="text-slate-800">│</span>

            {/* Language Mode */}
            <button
              onClick={() => openSettings('editor')}
              className="hover:text-blue-400 hover:bg-slate-800/80 px-1.5 py-0.5 rounded font-medium text-slate-300 transition-colors"
              title="Select Language Mode"
            >
              {getLanguageDisplayName(activeTab.language)}
            </button>
          </>
        ) : (
          <span className="text-slate-500 italic">No open editor tab</span>
        )}
      </div>

      {/* Right section: Formatter, AI Provider, Auth, Settings */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Prettier status */}
        <span className="hidden sm:flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer text-[10px] font-mono" title="Code Mind Formatter: Ready">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-emerald-400">
            <path d="M13.5 4.5L6.5 11.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Prettier
        </span>

        <span className="text-slate-800">│</span>

        {/* AI Provider Switcher */}
        <AIProviderSwitcher compact dropUp />

        <span className="text-slate-800">│</span>

        {/* User Session Profile */}
        {isAuthenticated ? (
          <div className="flex items-center gap-1.5">
            <span className="text-blue-400 font-medium max-w-[100px] truncate" title={user?.email}>
              {user?.name || user?.email?.split('@')[0]}
            </span>
            <button
              onClick={logout}
              className="text-[10px] text-slate-500 hover:text-red-400 transition-colors uppercase font-mono"
              title="Sign Out"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCurrentView('login')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Sign In
          </button>
        )}

        <span className="text-slate-800">│</span>

        {/* Settings button */}
        <button
          onClick={() => openSettings()}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
          title="Settings (Ctrl+,)"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M13.5 8C13.5 7.4 13.4 6.8 13.2 6.3L14.7 5.1L13.2 2.5L11.4 3.2C10.7 2.6 10 2.2 9.2 2L8.9 0.1H5.9L5.6 2C4.8 2.2 4.1 2.6 3.4 3.2L1.6 2.5L0.1 5.1L1.6 6.3C1.4 6.8 1.3 7.4 1.3 8C1.3 8.6 1.4 9.2 1.6 9.7L0.1 10.9L1.6 13.5L3.4 12.8C4.1 13.4 4.8 13.8 5.6 14L5.9 15.9H8.9L9.2 14C10 13.8 10.7 13.4 11.4 12.8L13.2 13.5L14.7 10.9L13.2 9.7C13.4 9.2 13.5 8.6 13.5 8Z" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        {/* CodeMind Version / Brand */}
        <span className="text-slate-800">│</span>
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity cursor-default">
          <img src={logoImg} alt="CodeMind" className="w-3 h-3 object-contain" />
          <span className="text-purple-400 font-bold text-[10px] tracking-wider">
            v1.0
          </span>
        </div>
      </div>
    </footer>
  );
};
