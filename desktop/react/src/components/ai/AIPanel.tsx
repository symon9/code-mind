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

  // Auto-resize textarea
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

  // Attach code button: inserts selected or active editor content into prompt
  const handleAttachCode = () => {
    if (!activeTab) {
      addToast('No active editor tab to attach code from', 'info');
      return;
    }

    let codeToAttach = '';
    // Check if user has active text selection in Monaco Editor
    if (window.codemindGetActiveSelection) {
      codeToAttach = window.codemindGetActiveSelection();
    }

    if (!codeToAttach || codeToAttach.trim().length === 0) {
      codeToAttach = activeTab.content;
    }

    const snippet = `\n\`\`\`${activeTab.language || 'text'}\n// ${activeTab.name}\n${codeToAttach}\n\`\`\`\n`;
    setInputValue((prev) => prev + snippet);
    addToast(`Attached code from ${activeTab.name}`, 'success');

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
    addToast('New chat session created', 'info');
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

    // 3. Prepare payload with full conversation history
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
        // Fallback to non-streaming /ai/chat endpoint if stream fails or isn't SSE
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

      // Process SSE / ReadableStream
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
      console.warn('[AIPanel] Live backend streaming endpoint unreachable, using fallback assistant response', err);
      // Simulated fallback response for demonstration/offline mode
      const fallbackText = `I analyzed your request using **${provider.toUpperCase()}**.\n\nHere is a quick overview:\n\`\`\`typescript\n// Example CodeMind response\nfunction helloCodeMind() {\n  console.log("Connected to CodeMind AI!");\n}\n\`\`\`\nLet me know if you would like me to refactor or write unit tests for your code!`;
      
      // Simulate chunked streaming fallback
      for (let i = 0; i < fallbackText.length; i += 6) {
        await new Promise((res) => setTimeout(res, 30));
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

  // Collapsed strip when panel is hidden
  if (!aiPanelOpen) {
    return (
      <div className="flex flex-col items-center py-3 bg-surface-100 border-l border-border w-10 h-full">
        <button
          onClick={toggleAIPanel}
          className="p-1.5 rounded-md hover:bg-surface-400/50 text-text-muted hover:text-text-primary transition-colors"
          title="Open AI Panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="mt-4 text-2xs text-text-muted font-semibold tracking-widest [writing-mode:vertical-lr] rotate-180">
          AI PANEL
        </span>
      </div>
    );
  }

  return (
    <aside className="flex flex-col bg-surface-100 border-l border-border animate-slide-in-right h-full w-[360px] shrink-0 select-none">
      {/* ─── Top Header & Session Selector ───────────────────────────────── */}
      <div className="flex flex-col border-b border-border bg-surface-100 shrink-0">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              AI Assistant
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <AIProviderSwitcher compact />
            <button
              onClick={toggleAIPanel}
              className="p-1 rounded hover:bg-surface-300 text-text-muted hover:text-text-primary transition-colors"
              title="Close panel (Ctrl+J)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Session Selector & + New Chat */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface-200/50 gap-2">
          {/* Dropdown */}
          <div className="relative flex-1" ref={dropdownRef}>
            <button
              onClick={() => setIsSessionDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-2.5 py-1 text-xs rounded border border-border bg-surface-100 text-text-primary hover:bg-surface-200 transition-colors"
            >
              <span className="truncate font-medium">{activeSession?.title || 'Chat Session'}</span>
              <svg className="w-3.5 h-3.5 text-text-muted shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isSessionDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 w-full rounded-lg shadow-xl bg-surface-200 border border-border py-1 text-xs max-h-56 overflow-y-auto">
                <div className="px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-text-muted border-b border-border/50">
                  Recent Sessions
                </div>
                {chatSessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSession(s.id);
                      setIsSessionDropdownOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-surface-300 transition-colors
                      ${s.id === activeSessionId ? 'text-accent font-semibold bg-accent/10' : 'text-text-primary'}
                    `}
                  >
                    <span className="truncate">{s.title}</span>
                    <span className="text-[10px] text-text-muted shrink-0 ml-2">
                      {s.messages.length} msgs
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* + New Chat */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-accent hover:bg-accent-light text-white font-medium shadow-sm transition-colors shrink-0"
            title="New Chat Session"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New</span>
          </button>
        </div>
      </div>

      {/* ─── Chat Message List ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-surface-0/50">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Streaming indicator: animated bouncing dots */}
        {isStreaming && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-200/80 border border-border w-fit animate-pulse">
            <div className="flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-2xs font-medium text-text-muted uppercase tracking-wider">
              AI is typing…
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Area ───────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-border bg-surface-100 shrink-0">
        {/* Controls Above Input */}
        <div className="flex items-center justify-between mb-2">
          {/* Provider Badge */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-semibold rounded-full bg-accent/15 border border-accent/30 text-accent-light">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {provider.toUpperCase()}
          </span>

          {/* Attach code button */}
          <button
            type="button"
            onClick={handleAttachCode}
            className="flex items-center gap-1 px-2 py-0.5 text-2xs font-medium rounded border border-border bg-surface-200 hover:bg-surface-300 text-text-secondary hover:text-text-primary transition-colors"
            title="Attach code from active editor tab"
          >
            <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>Attach Code</span>
          </button>
        </div>

        {/* Textarea + Send */}
        <div className="relative flex flex-col">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask CodeMind AI (Enter to send, Shift+Enter for newline)…"
            rows={2}
            className="
              w-full bg-surface-200 border border-border rounded-lg pl-3 pr-10 py-2.5 text-xs
              text-text-primary placeholder:text-text-muted
              focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30
              resize-none transition-colors leading-relaxed
            "
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="
              absolute right-2 bottom-2 p-1.5 rounded-md
              bg-accent hover:bg-accent-light disabled:bg-surface-400 disabled:text-text-muted
              text-white transition-colors shadow-sm
            "
            title="Send Message"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
