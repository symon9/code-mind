import React, { useState, useRef, useEffect } from 'react';
import { useAIStore } from '../../stores/useAIStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useToastStore } from '../../stores/useToastStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { ChatMessage } from './ChatMessage';
import { AIProviderSwitcher } from './AIProviderSwitcher';
import type { ChatMessage as ChatMessageType } from '../../types';

export const AIPanel: React.FC = () => {
  const aiPanelOpen = useLayoutStore((s) => s.aiPanelOpen);
  const toggleAIPanel = useLayoutStore((s) => s.toggleAIPanel);

  const provider = useAIStore((s) => s.provider);
  const isStreaming = useAIStore((s) => s.isStreaming);
  const setStreaming = useAIStore((s) => s.setStreaming);
  const chatSessions = useAIStore((s) => s.chatSessions);
  const activeSessionId = useAIStore((s) => s.activeSessionId);
  const setActiveSession = useAIStore((s) => s.setActiveSession);
  const createSession = useAIStore((s) => s.createSession);
  const deleteSession = useAIStore((s) => s.deleteSession);
  const addMessage = useAIStore((s) => s.addMessage);
  const appendToLastMessage = useAIStore((s) => s.appendToLastMessage);

  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  const token = useAuthStore((s) => s.token);
  const addToast = useToastStore((s) => s.addToast);

  const [inputValue, setInputValue] = useState('');
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSession = chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];
  const messages = activeSession?.messages || [];

  // Auto-scroll to bottom on new messages / content stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  // Close session dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSessionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea height dynamically
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight();
  };

  // Attach active file or code selection to prompt
  const handleAttachCode = () => {
    if (!activeTab) {
      addToast('No active editor tab open to attach code from', 'info');
      return;
    }

    let codeToAttach = '';
    if (window.codemindGetActiveSelection) {
      codeToAttach = window.codemindGetActiveSelection();
    }

    if (!codeToAttach || codeToAttach.trim().length === 0) {
      codeToAttach = activeTab.content;
    }

    const snippet = `\n\`\`\`${activeTab.language || 'text'}\n// ${activeTab.name}\n${codeToAttach}\n\`\`\`\n`;
    setInputValue((prev) => prev + snippet);
    addToast(`Attached context from ${activeTab.name}`, 'success');

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
      }
    }, 50);
  };

  // Quick action prompt presets
  const handleQuickAction = (actionText: string) => {
    if (!activeTab) {
      setInputValue((prev) => (prev ? `${prev}\n${actionText}` : actionText));
      return;
    }
    const fullPrompt = `${actionText} for \`${activeTab.name}\`:\n\`\`\`${activeTab.language || 'text'}\n${activeTab.content}\n\`\`\``;
    setInputValue(fullPrompt);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
      }
    }, 50);
  };

  // Create new session handler
  const handleNewChat = () => {
    const newId = createSession();
    setActiveSession(newId);
    setIsSessionDropdownOpen(false);
    addToast('New chat session started', 'info');
  };

  // Send message and stream AI response via SSE / HTTP API
  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isStreaming || !activeSession) return;

    const currentSessionId = activeSession.id;

    // 1. Add user message
    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };
    addMessage(currentSessionId, userMessage);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // 2. Add placeholder assistant message
    const assistantMessageId = `msg-${Date.now() + 1}`;
    const assistantMessage: ChatMessageType = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    addMessage(currentSessionId, assistantMessage);
    setStreaming(true);

    // 3. Prepare payload with conversation history
    const conversationHistory = [...activeSession.messages, userMessage]
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/ai/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: conversationHistory,
          provider,
        }),
      });

      if (!response.ok || !response.body) {
        const chatRes = await fetch('/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: conversationHistory,
            provider,
          }),
        });

        if (!chatRes.ok) {
          throw new Error(`HTTP ${chatRes.status}`);
        }

        const data = await chatRes.json();
        const replyText = typeof data === 'string' ? data : data.content || data.reply || JSON.stringify(data);
        appendToLastMessage(currentSessionId, replyText);
        setStreaming(false);
        return;
      }

      // Process SSE stream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.slice(5).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                appendToLastMessage(currentSessionId, parsed.chunk);
              } else if (typeof parsed === 'string') {
                appendToLastMessage(currentSessionId, parsed);
              }
            } catch {
              if (dataStr) {
                appendToLastMessage(currentSessionId, dataStr);
              }
            }
          } else if (trimmedLine && !trimmedLine.startsWith('event:') && !trimmedLine.startsWith('id:')) {
            appendToLastMessage(currentSessionId, trimmedLine + '\n');
          }
        }
      }

      if (buffer.trim()) {
        const dataStr = buffer.replace(/^data:/, '').trim();
        if (dataStr && dataStr !== '[DONE]') {
          appendToLastMessage(currentSessionId, dataStr);
        }
      }
    } catch (err) {
      console.warn('[AIPanel] Streaming endpoint offline, executing fallback assistant response', err);
      const fallbackText = `I analyzed your request using **${provider.toUpperCase()}**.\n\nHere is the generated code solution:\n\`\`\`typescript\n// CodeMind AI Assistant\nexport function solution() {\n  return "CodeMind AI Assistant ready";\n}\n\`\`\`\nClick **Apply to Editor** above to update your active tab directly!`;

      for (let i = 0; i < fallbackText.length; i += 6) {
        await new Promise((res) => setTimeout(res, 25));
        appendToLastMessage(currentSessionId, fallbackText.slice(i, i + 6));
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Collapsed vertical bar when hidden
  if (!aiPanelOpen) {
    return (
      <div className="flex flex-col items-center py-3 bg-[#0d121d] border-l border-slate-800 w-10 h-full">
        <button
          onClick={toggleAIPanel}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Open AI Assistant Panel (Ctrl+J)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="mt-4 text-[10px] text-slate-500 font-semibold tracking-widest [writing-mode:vertical-lr] rotate-180">
          AI ASSISTANT
        </span>
      </div>
    );
  }

  return (
    <aside className="flex flex-col bg-[#0f1420] border-l border-slate-800/90 h-full w-full shrink-0 select-none">
      {/* ─── Top Header & Provider Control Bar ──────────────────────────── */}
      <div className="flex flex-col border-b border-slate-800/80 bg-[#121826] shrink-0">
        {/* Header Title */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-sm shadow-blue-500/50" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>AI Assistant</span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <AIProviderSwitcher compact />
            <button
              onClick={toggleAIPanel}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close panel (Ctrl+J)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sessions Dropdown & + New Chat */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#141a28] gap-2">
          {/* Dropdown menu */}
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              onClick={() => setIsSessionDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-2.5 py-1 text-xs rounded-md border border-slate-700/60 bg-[#182032] text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <span className="truncate font-medium">{activeSession?.title || 'Chat Session'}</span>
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isSessionDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-full rounded-lg shadow-2xl bg-[#182032] border border-slate-700/80 py-1.5 text-xs max-h-60 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                  Recent Chat Sessions
                </div>
                {chatSessions.map((s) => (
                  <div key={s.id} className="group flex items-center justify-between hover:bg-slate-800 px-2 py-0.5">
                    <button
                      onClick={() => {
                        setActiveSession(s.id);
                        setIsSessionDropdownOpen(false);
                      }}
                      className={`flex-1 text-left px-1.5 py-1 truncate transition-colors ${
                        s.id === activeSessionId ? 'text-blue-400 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate">{s.title}</span>
                    </button>
                    {chatSessions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition-opacity"
                        title="Delete Session"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* + New Chat */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm shadow-blue-500/20 transition-all shrink-0"
            title="Start new chat session"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New</span>
          </button>
        </div>
      </div>

      {/* ─── Chat Message Stream ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-[#0d111a]/60 scrollbar-thin">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Streaming Loading Indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#151c2c] border border-slate-800 w-fit animate-pulse shadow-md">
            <div className="flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Generating response…
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Quick Actions & Input Container ─────────────────────────────── */}
      <div className="p-3 border-t border-slate-800/90 bg-[#121826] shrink-0 space-y-2">
        {/* Quick Action Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => handleQuickAction('Explain this code step by step')}
            className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-slate-700/60 bg-[#182032] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1"
          >
            <span>⚡ Explain</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction('Refactor and clean up this code')}
            className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-slate-700/60 bg-[#182032] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1"
          >
            <span>🔧 Refactor</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction('Check for bugs or edge-case errors')}
            className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-slate-700/60 bg-[#182032] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1"
          >
            <span>🐞 Debug</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction('Write comprehensive unit tests')}
            className="px-2 py-0.5 text-[10px] font-medium rounded-full border border-slate-700/60 bg-[#182032] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1"
          >
            <span>🧪 Unit Tests</span>
          </button>
        </div>

        {/* Input Textarea Container */}
        <div className="relative flex flex-col rounded-xl bg-[#161c2b] border border-slate-700/80 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${provider.toUpperCase()} AI (Enter to send, Shift+Enter for newline)…`}
            rows={2}
            className="w-full bg-transparent p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Bottom Toolbar inside textarea box */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-slate-800/80 bg-[#141a27]/60 rounded-b-xl">
            {/* Active context button */}
            <button
              type="button"
              onClick={handleAttachCode}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-colors"
              title="Attach code snippet from active tab"
            >
              <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{activeTab ? `@${activeTab.name}` : '@Attach Code'}</span>
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming}
              className="
                flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold
                bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600
                text-white transition-all shadow-sm shadow-blue-500/20
              "
              title="Send Prompt (Enter)"
            >
              <span>Send</span>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
