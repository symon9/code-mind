import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAIStore } from '../../stores/useAIStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '../../types';

// ─── Component ────────────────────────────────────────────────────────────────

export const AIPanel: React.FC = () => {
  const aiPanelOpen = useLayoutStore((s) => s.aiPanelOpen);
  const toggleAIPanel = useLayoutStore((s) => s.toggleAIPanel);

  const provider = useAIStore((s) => s.provider);
  const isStreaming = useAIStore((s) => s.isStreaming);
  const chatSessions = useAIStore((s) => s.chatSessions);
  const activeSessionId = useAIStore((s) => s.activeSessionId);
  const addMessage = useAIStore((s) => s.addMessage);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = chatSessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || !activeSessionId) return;

      const userMessage: ChatMessageType = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: inputValue.trim(),
        timestamp: Date.now(),
      };

      addMessage(activeSessionId, userMessage);

      // Simulated AI response (will be replaced with real API calls)
      setTimeout(() => {
        const aiResponse: ChatMessageType = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `I received your message: "${inputValue.trim()}"\n\nThis is a simulated response. Once the backend is connected, I'll stream real AI responses through the CodeMind API.`,
          timestamp: Date.now(),
        };
        addMessage(activeSessionId, aiResponse);
      }, 800);

      setInputValue('');
    },
    [inputValue, activeSessionId, addMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  // Collapsed state — show a narrow toggle strip
  if (!aiPanelOpen) {
    return (
      <div className="flex flex-col items-center py-3 bg-surface-100 border-l border-border w-10">
        <button
          onClick={toggleAIPanel}
          className="p-1.5 rounded-md hover:bg-surface-400/50 text-text-muted hover:text-text-primary transition-colors"
          title="Open AI Panel"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {/* Vertical label */}
        <span className="mt-4 text-2xs text-text-muted font-semibold tracking-widest [writing-mode:vertical-lr] rotate-180">
          AI
        </span>
      </div>
    );
  }

  return (
    <aside className="flex flex-col bg-surface-100 border-l border-border animate-slide-in-right h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
            CodeMind AI
          </h2>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs font-medium rounded bg-accent/15 text-accent-light border border-accent/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {provider}
          </span>
        </div>
        <button
          onClick={toggleAIPanel}
          className="p-1 rounded-md hover:bg-surface-400/50 text-text-muted hover:text-text-primary transition-colors"
          title="Close AI Panel"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-text-muted">AI is thinking…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border shrink-0">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask CodeMind AI…"
            rows={2}
            className="
              w-full bg-surface-200 border border-border rounded-lg px-3 py-2.5 pr-12
              text-sm text-text-primary placeholder:text-text-muted
              focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
              resize-none transition-colors
            "
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="
              absolute right-2 bottom-2 p-1.5 rounded-md
              bg-accent hover:bg-accent-light disabled:bg-surface-400 disabled:text-text-muted
              text-white transition-colors
            "
            title="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 2L7 9M14 2L10 14L7 9M14 2L2 6L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-2xs text-text-muted text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-surface-300 border border-border font-mono">Enter</kbd> to send ·{' '}
          <kbd className="px-1 py-0.5 rounded bg-surface-300 border border-border font-mono">Shift+Enter</kbd> for new line
        </p>
      </form>
    </aside>
  );
};
