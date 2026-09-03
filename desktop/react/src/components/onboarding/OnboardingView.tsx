import React, { useState } from 'react';
import { useFileTreeStore } from '../../stores/useFileTreeStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import logoImg from '../../assets/logo';

export const OnboardingView: React.FC = () => {
  const openFolder = useFileTreeStore((s) => s.openFolder);
  const openRecentFolder = useFileTreeStore((s) => s.openRecentFolder);
  const recentFolders = useFileTreeStore((s) => s.recentFolders);

  const createNewFile = useEditorStore((s) => s.createNewFile);
  const openFile = useEditorStore((s) => s.openFile);
  const recentFiles = useEditorStore((s) => s.recentFiles);

  const openSettings = useLayoutStore((s) => s.openSettings);
  const aiProvider = useSettingsStore((s) => s.aiProvider);

  const [viewTab, setViewTab] = useState<'folders' | 'files'>('folders');

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0e121b] p-8 overflow-y-auto relative select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full flex flex-col items-center text-center space-y-7 z-10 animate-in fade-in duration-300 my-auto py-6">
        {/* Brand Badge & Hero Title */}
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-900/40 via-indigo-900/30 to-blue-900/40 border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/30 p-2">
            <img src={logoImg} alt="CodeMind Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>

          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              CodeMind <span className="text-blue-400 font-extrabold">Studio</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              AI-Native Intelligent Code Editor built for high-speed software development.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center justify-center gap-3 w-full max-w-md">
          {/* Open Folder */}
          <button
            onClick={openFolder}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4V12C2 12.5523 2.44772 13 3 13H13C13.5523 13 14 12.5523 14 12V6C14 5.44772 13.5523 5 13 5H8L6.5 3H3C2.44772 3 2 3.44772 2 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8 7V11M6 9H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span>Open Folder</span>
          </button>

          {/* New File */}
          <button
            onClick={createNewFile}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#161c2b] hover:bg-[#1f283e] border border-slate-700/80 text-slate-200 font-semibold text-xs transition-all transform hover:-translate-y-0.5"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-400">
              <path d="M3 2.5C3 1.94772 3.44772 1.5 4 1.5H9.5L13 5V13.5C13 14.0523 12.5523 14.5 12 14.5H4C3.44772 14.5 3 14.0523 3 13.5V2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8 6V10M6 8H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span>New File</span>
          </button>
        </div>

        {/* AI Status Banner */}
        <div className="w-full max-w-md p-3.5 rounded-xl bg-[#141a27] border border-slate-800 flex items-center justify-between gap-3 text-left shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
              ✦
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">AI Engine: {aiProvider.toUpperCase()}</span>
              <span className="text-[11px] text-slate-400">Ready for code generation & stream analysis</span>
            </div>
          </div>
          <button
            onClick={() => openSettings('ai')}
            className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors shrink-0"
          >
            Config AI
          </button>
        </div>

        {/* Keyboard Shortcuts Quick Reference Grid */}
        <div className="w-full max-w-md text-left space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>Essential Keyboard Shortcuts</span>
            <button onClick={() => openSettings('shortcuts')} className="text-blue-400 hover:underline text-[10px]">
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-[#141a27] border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-300">New File</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Ctrl+N</kbd>
            </div>
            <div className="p-2 rounded-lg bg-[#141a27] border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-300">Open Folder</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Ctrl+O</kbd>
            </div>
            <div className="p-2 rounded-lg bg-[#141a27] border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-300">Toggle Sidebar</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Ctrl+B</kbd>
            </div>
            <div className="p-2 rounded-lg bg-[#141a27] border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-300">AI Assistant</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Ctrl+J</kbd>
            </div>
          </div>
        </div>

        {/* Recent Items Section */}
        <div className="w-full max-w-md text-left space-y-3 pt-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewTab('folders')}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  viewTab === 'folders'
                    ? 'text-blue-400 border-b-2 border-blue-500 pb-0.5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Recent Folders
              </button>
              <button
                onClick={() => setViewTab('files')}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  viewTab === 'files'
                    ? 'text-blue-400 border-b-2 border-blue-500 pb-0.5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Recent Files
              </button>
            </div>
          </div>

          {/* Recent Folders */}
          {viewTab === 'folders' && (
            <div>
              {recentFolders.length > 0 ? (
                <div className="border border-slate-800 rounded-xl bg-[#141a27] divide-y divide-slate-800/60 overflow-hidden shadow-sm">
                  {recentFolders.map((folder) => (
                    <button
                      key={folder.path}
                      onClick={() => openRecentFolder(folder.path)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/80 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-400 shrink-0">
                          <path d="M2 4V12C2 12.5523 2.44772 13 3 13H13C13.5523 13 14 12.5523 14 12V6C14 5.44772 13.5523 5 13 5H8L6.5 3H3C2.44772 3 2 3.44772 2 4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs text-slate-200 group-hover:text-blue-400 truncate font-mono font-medium">
                          {folder.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate max-w-[200px] font-mono ml-2">
                        {folder.path}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 bg-[#141a27]/40">
                  No recent folders. Click "Open Folder" above to start.
                </div>
              )}
            </div>
          )}

          {/* Recent Files */}
          {viewTab === 'files' && (
            <div>
              {recentFiles.length > 0 ? (
                <div className="border border-slate-800 rounded-xl bg-[#141a27] divide-y divide-slate-800/60 overflow-hidden shadow-sm">
                  {recentFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => openFile(file.path)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/80 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-blue-400 shrink-0">
                          <path d="M3 2.5C3 1.94772 3.44772 1.5 4 1.5H9.5L13 5V13.5C13 14.0523 12.5523 14.5 12 14.5H4C3.44772 14.5 3 14.0523 3 13.5V2.5Z" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                        <span className="text-xs text-slate-200 group-hover:text-blue-400 truncate font-mono font-medium">
                          {file.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate max-w-[180px] font-mono ml-2">
                        {file.path}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 bg-[#141a27]/40">
                  No recent files. Open a file or create a new file to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
