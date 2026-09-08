import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToastStore } from '../../stores/useToastStore';
import { patchUserPreferencesApi, testAiConnectionApi } from '../../utils/api';
import type { AIProvider, Theme } from '../../types';
import logoImg from '../../assets/logo';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useLayoutStore((s) => s.isSettingsOpen);
  const activeTab = useLayoutStore((s) => s.activeSettingsTab);
  const closeSettings = useLayoutStore((s) => s.closeSettings);
  const setActiveTab = useLayoutStore((s) => s.setActiveSettingsTab);

  const settings = useSettingsStore();
  const token = useAuthStore((s) => s.token);
  const addToast = useToastStore((s) => s.addToast);

  // Local Form State
  const [fontSize, setFontSize] = useState<number>(settings.fontSize);
  const [fontFamily, setFontFamily] = useState<string>(settings.fontFamily);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>(settings.wordWrap === 'off' ? 'off' : 'on');
  const [autoSave, setAutoSave] = useState<boolean>(settings.autoSave);
  const [tabSize, setTabSize] = useState<2 | 4>(settings.tabSize || 2);

  const [theme, setTheme] = useState<Theme>(settings.theme);

  const [aiProvider, setAiProvider] = useState<AIProvider>(settings.aiProvider);
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [ollamaUrl, setOllamaUrl] = useState<string>(settings.ollamaUrl || 'http://localhost:11434');

  const [isSaving, setIsSaving] = useState(false);
  const [testResults, setTestResults] = useState<
    Record<string, { loading: boolean; success?: boolean; message?: string }>
  >({});

  // Sync state when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setFontSize(settings.fontSize);
      setFontFamily(settings.fontFamily);
      setWordWrap(settings.wordWrap === 'off' ? 'off' : 'on');
      setAutoSave(settings.autoSave);
      setTabSize(settings.tabSize || 2);
      setTheme(settings.theme);
      setAiProvider(settings.aiProvider);
      setOllamaUrl(settings.ollamaUrl || 'http://localhost:11434');
      setAnthropicApiKey('');
      setOpenaiApiKey('');
      setGeminiApiKey('');
      setTestResults({});
    }
  }, [isSettingsOpen, settings]);

  if (!isSettingsOpen) return null;

  const handleTestConnection = async (provider: string) => {
    if (!token) {
      addToast('Please log in first to test AI provider connections', 'info');
      return;
    }

    setTestResults((prev) => ({
      ...prev,
      [provider]: { loading: true },
    }));

    try {
      let key = '';
      if (provider === 'anthropic') key = anthropicApiKey;
      if (provider === 'openai') key = openaiApiKey;
      if (provider === 'gemini') key = geminiApiKey;

      const res = await testAiConnectionApi(token, {
        provider,
        apiKey: key || undefined,
        ollamaUrl: provider === 'ollama' ? ollamaUrl : undefined,
      });

      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          loading: false,
          success: res.success,
          message: res.message,
        },
      }));

      if (res.success) {
        addToast(`${provider.toUpperCase()} connection verified (${res.latencyMs}ms)`, 'success');
      } else {
        addToast(res.message || `Failed to connect to ${provider}`, 'error');
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          loading: false,
          success: false,
          message: err?.message || 'Connection test failed',
        },
      }));
      addToast(err?.message || `Failed to connect to ${provider}`, 'error');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 1. Update frontend store
      settings.updateSettings({
        fontSize,
        fontFamily,
        wordWrap,
        autoSave,
        tabSize,
        theme,
        aiProvider,
        ollamaUrl,
      });

      // 2. If authenticated, PATCH to backend API
      if (token) {
        await patchUserPreferencesApi(token, {
          fontSize,
          fontFamily,
          wordWrap,
          autoSave,
          tabSize,
          theme,
          aiProvider,
          ollamaUrl,
          ...(anthropicApiKey ? { anthropicApiKey } : {}),
          ...(openaiApiKey ? { openaiApiKey } : {}),
          ...(geminiApiKey ? { geminiApiKey } : {}),
        });
      }

      addToast('Settings saved successfully', 'success');
      closeSettings();
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      addToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeSettings} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl h-[600px] bg-surface-100 border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-200/50">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="CodeMind" className="w-5 h-5 rounded-md object-contain shadow-sm" />
            <h2 className="text-base font-semibold text-text-primary">Settings</h2>
          </div>
          <button
            onClick={closeSettings}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Modal Main Area */}
        <div className="flex flex-1 min-h-0">
          {/* Left Nav Tabs */}
          <div className="w-48 border-r border-border bg-surface-200/30 p-2 space-y-1 select-none">
            <TabButton id="editor" label="Editor" active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} icon="⚙️" />
            <TabButton id="appearance" label="Appearance" active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon="🎨" />
            <TabButton id="ai" label="AI Provider" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon="🤖" />
            <TabButton id="shortcuts" label="Shortcuts" active={activeTab === 'shortcuts'} onClick={() => setActiveTab('shortcuts')} icon="⌨️" />
          </div>

          {/* Right Panel Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-100">
            {activeTab === 'editor' && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-light border-b border-border pb-2">
                  Editor Settings
                </h3>

                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary block">Font Size</label>
                    <span className="text-xs text-text-muted">Controls the font size in pixels (10–24)</span>
                  </div>
                  <input
                    type="number"
                    min={10}
                    max={24}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 bg-surface-200 border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent text-center"
                  />
                </div>

                {/* Font Family */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary block">Font Family</label>
                    <span className="text-xs text-text-muted">Monospace font used in the editor</span>
                  </div>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-48 px-3 py-1.5 bg-surface-200 border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="'Fira Code', monospace">Fira Code</option>
                    <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    <option value="'Cascadia Code', monospace">Cascadia Code</option>
                    <option value="'Source Code Pro', monospace">Source Code Pro</option>
                    <option value="monospace">Standard Monospace</option>
                  </select>
                </div>

                {/* Word Wrap */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary block">Word Wrap</label>
                    <span className="text-xs text-text-muted">Wrap long lines to fit the editor viewport</span>
                  </div>
                  <ToggleSwitch
                    checked={wordWrap === 'on'}
                    onChange={(val) => setWordWrap(val ? 'on' : 'off')}
                  />
                </div>

                {/* Auto Save */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary block">Auto Save</label>
                    <span className="text-xs text-text-muted">Automatically save active file changes</span>
                  </div>
                  <ToggleSwitch
                    checked={autoSave}
                    onChange={setAutoSave}
                  />
                </div>

                {/* Tab Size */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-text-primary block">Tab Size</label>
                    <span className="text-xs text-text-muted">Number of spaces per tab indentation</span>
                  </div>
                  <select
                    value={tabSize}
                    onChange={(e) => setTabSize(Number(e.target.value) as 2 | 4)}
                    className="w-20 px-3 py-1.5 bg-surface-200 border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent text-center"
                  >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-light border-b border-border pb-2">
                  Appearance Settings
                </h3>

                {/* Theme */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary block">Editor & Application Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    <ThemeOption
                      id="dark"
                      label="CodeMind Dark (App Match)"
                      active={theme === 'dark'}
                      onClick={() => setTheme('dark')}
                    />
                    <ThemeOption
                      id="pitch-black"
                      label="Pitch Black"
                      active={theme === 'pitch-black'}
                      onClick={() => setTheme('pitch-black')}
                    />
                    <ThemeOption
                      id="light"
                      label="Light"
                      active={theme === 'light'}
                      onClick={() => setTheme('light')}
                    />
                    <ThemeOption
                      id="system"
                      label="System"
                      active={theme === 'system'}
                      onClick={() => setTheme('system')}
                    />
                  </div>
                </div>

                {/* Accent Color Preview */}
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-text-primary block">Accent Color</label>
                  <div className="flex items-center gap-3 p-3 bg-surface-200/50 border border-border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-accent glow-accent border border-white/20" />
                    <div>
                      <span className="text-xs font-semibold text-text-primary block">CodeMind Purple</span>
                      <span className="text-[11px] text-text-muted">Primary theme accent (`#8b5cf6`)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-5 animate-fade-in">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-light border-b border-border pb-2">
                  AI Provider Settings
                </h3>

                {/* Default Provider */}
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">Default AI Provider</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    <ProviderOption
                      id="gemini"
                      name="Gemini"
                      active={aiProvider === 'gemini'}
                      onClick={() => setAiProvider('gemini')}
                    />
                    <ProviderOption
                      id="anthropic"
                      name="Anthropic"
                      active={aiProvider === 'anthropic'}
                      onClick={() => setAiProvider('anthropic')}
                    />
                    <ProviderOption
                      id="openai"
                      name="OpenAI"
                      active={aiProvider === 'openai'}
                      onClick={() => setAiProvider('openai')}
                    />
                    <ProviderOption
                      id="ollama"
                      name="Ollama"
                      active={aiProvider === 'ollama'}
                      onClick={() => setAiProvider('ollama')}
                    />
                  </div>
                </div>

                {/* Gemini Key */}
                <div className="space-y-1.5 p-3 rounded-xl bg-surface-200/40 border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <span>✨ Google Gemini</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-normal">Fast & Native</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('gemini')}
                      disabled={testResults['gemini']?.loading}
                      className="text-[11px] px-2.5 py-1 rounded bg-surface-300 hover:bg-accent hover:text-white text-text-primary border border-border transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {testResults['gemini']?.loading ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy••••••••••••••••"
                    className="w-full px-3.5 py-2 bg-surface-100 border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent font-mono"
                  />
                  {testResults['gemini']?.message && (
                    <div className={`text-[11px] px-2 py-1 rounded flex items-center gap-1 ${testResults['gemini'].success ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      <span>{testResults['gemini'].success ? '✓' : '✗'}</span>
                      <span>{testResults['gemini'].message}</span>
                    </div>
                  )}
                </div>

                {/* Anthropic Key */}
                <div className="space-y-1.5 p-3 rounded-xl bg-surface-200/40 border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <span>🧠 Anthropic Claude</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('anthropic')}
                      disabled={testResults['anthropic']?.loading}
                      className="text-[11px] px-2.5 py-1 rounded bg-surface-300 hover:bg-accent hover:text-white text-text-primary border border-border transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {testResults['anthropic']?.loading ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                  <input
                    type="password"
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    placeholder="sk-ant-••••••••••••••••"
                    className="w-full px-3.5 py-2 bg-surface-100 border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent font-mono"
                  />
                  {testResults['anthropic']?.message && (
                    <div className={`text-[11px] px-2 py-1 rounded flex items-center gap-1 ${testResults['anthropic'].success ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      <span>{testResults['anthropic'].success ? '✓' : '✗'}</span>
                      <span>{testResults['anthropic'].message}</span>
                    </div>
                  )}
                </div>

                {/* OpenAI Key */}
                <div className="space-y-1.5 p-3 rounded-xl bg-surface-200/40 border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <span>⚡ OpenAI GPT</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('openai')}
                      disabled={testResults['openai']?.loading}
                      className="text-[11px] px-2.5 py-1 rounded bg-surface-300 hover:bg-accent hover:text-white text-text-primary border border-border transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {testResults['openai']?.loading ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                  <input
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-proj-••••••••••••••••"
                    className="w-full px-3.5 py-2 bg-surface-100 border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent font-mono"
                  />
                  {testResults['openai']?.message && (
                    <div className={`text-[11px] px-2 py-1 rounded flex items-center gap-1 ${testResults['openai'].success ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      <span>{testResults['openai'].success ? '✓' : '✗'}</span>
                      <span>{testResults['openai'].message}</span>
                    </div>
                  )}
                </div>

                {/* Ollama URL */}
                <div className="space-y-1.5 p-3 rounded-xl bg-surface-200/40 border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <span>🦙 Ollama (Local)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTestConnection('ollama')}
                      disabled={testResults['ollama']?.loading}
                      className="text-[11px] px-2.5 py-1 rounded bg-surface-300 hover:bg-accent hover:text-white text-text-primary border border-border transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {testResults['ollama']?.loading ? 'Testing...' : 'Test Connection'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3.5 py-2 bg-surface-100 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                  />
                  {testResults['ollama']?.message && (
                    <div className={`text-[11px] px-2 py-1 rounded flex items-center gap-1 ${testResults['ollama'].success ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      <span>{testResults['ollama'].success ? '✓' : '✗'}</span>
                      <span>{testResults['ollama'].message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-light border-b border-border pb-2">
                  Keyboard Shortcuts
                </h3>
                <div className="border border-border rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-surface-200/80 text-text-muted font-mono uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2">Shortcut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-text-primary">
                      <tr>
                        <td className="px-4 py-2.5">Open Settings</td>
                        <td className="px-4 py-2.5 font-mono text-accent-light">Cmd / Ctrl + ,</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">Toggle Explorer Sidebar</td>
                        <td className="px-4 py-2.5 font-mono text-accent-light">Cmd / Ctrl + B</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">Toggle AI Panel</td>
                        <td className="px-4 py-2.5 font-mono text-accent-light">Cmd / Ctrl + J</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">Save Current File</td>
                        <td className="px-4 py-2.5 font-mono text-accent-light">Cmd / Ctrl + S</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5">Close Active Tab</td>
                        <td className="px-4 py-2.5 font-mono text-accent-light">Cmd / Ctrl + W</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-border bg-surface-200/50">
          <button
            onClick={closeSettings}
            className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-light text-white shadow-md shadow-accent/25 transition-all duration-150 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const TabButton: React.FC<{ id: string; label: string; active: boolean; icon: string; onClick: () => void }> = ({
  label,
  active,
  icon,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      active
        ? 'bg-accent/15 text-accent-light border border-accent/30 font-semibold'
        : 'text-text-muted hover:text-text-primary hover:bg-surface-300/50'
    }`}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
      checked ? 'bg-accent justify-end' : 'bg-surface-300 justify-start'
    }`}
  >
    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
  </button>
);

const ThemeOption: React.FC<{ id: string; label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg border text-xs font-medium text-center transition-all ${
      active
        ? 'bg-accent/10 border-accent text-accent-light'
        : 'bg-surface-200/40 border-border text-text-muted hover:text-text-primary'
    }`}
  >
    {label}
  </button>
);

const ProviderOption: React.FC<{ id: string; name: string; active: boolean; onClick: () => void }> = ({
  name,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg border text-xs font-medium text-center transition-all ${
      active
        ? 'bg-accent/10 border-accent text-accent-light'
        : 'bg-surface-200/40 border-border text-text-muted hover:text-text-primary'
    }`}
  >
    {name}
  </button>
);
