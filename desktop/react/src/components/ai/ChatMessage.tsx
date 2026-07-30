import React from 'react';
import type { ChatMessage as ChatMessageType } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatMessageProps {
  message: ChatMessageType;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      <div
        className={`
          relative max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-accent/20 border border-accent/30 text-text-primary rounded-br-sm'
            : ''
          }
          ${isAssistant
            ? 'bg-surface-300/80 border border-border text-text-primary rounded-bl-sm'
            : ''
          }
          ${isSystem
            ? 'bg-surface-200/50 border border-border/50 text-text-muted text-xs text-center mx-auto max-w-[75%] rounded-lg'
            : ''
          }
        `}
      >
        {/* Role Badge */}
        {!isSystem && (
          <div className={`
            text-2xs font-semibold uppercase tracking-wider mb-1.5
            ${isUser ? 'text-accent-light' : 'text-text-secondary'}
          `}>
            {isUser ? 'You' : 'CodeMind AI'}
          </div>
        )}

        {/* Content */}
        <div className="whitespace-pre-wrap font-sans break-words">
          {message.content}
        </div>

        {/* Timestamp */}
        <div className={`
          text-2xs mt-2 
          ${isSystem ? 'text-text-muted/60' : 'text-text-muted'}
        `}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
