import React, { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

// ─── Simple & Robust Markdown / Code Block Renderer ─────────────────────────

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-lg border border-border bg-surface-0 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-200 border-b border-border/80 text-text-muted">
        <span className="text-2xs font-semibold uppercase tracking-wider text-accent-light">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-2xs px-2 py-0.5 rounded hover:bg-surface-300 hover:text-text-primary transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-text-primary leading-relaxed whitespace-pre font-mono text-[12.5px]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const renderMarkdownContent = (content: string) => {
  // Regex to split code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore) {
      parts.push(renderFormattedText(textBefore, `text-${lastIndex}`));
    }

    const language = match[1] || 'text';
    const code = match[2].trimEnd();
    parts.push(
      <CodeBlock key={`code-${match.index}`} language={language} code={code} />
    );

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.slice(lastIndex);
  if (remainingText) {
    parts.push(renderFormattedText(remainingText, `text-${lastIndex}`));
  }

  return parts;
};

// Formats inline code `code`, bold **text**, and lists
const renderFormattedText = (text: string, keyPrefix: string) => {
  const paragraphs = text.split('\n\n');

  return (
    <div key={keyPrefix} className="space-y-2">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        return (
          <p key={`${keyPrefix}-p-${pIdx}`} className="leading-relaxed">
            {lines.map((line, lIdx) => {
              // Parse inline code `foo`
              const lineParts = line.split(/(`[^`]+`)/g);
              return (
                <React.Fragment key={`l-${lIdx}`}>
                  {lIdx > 0 && <br />}
                  {lineParts.map((part, partIdx) => {
                    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
                      return (
                        <code
                          key={`c-${partIdx}`}
                          className="px-1.5 py-0.5 mx-0.5 rounded bg-surface-300 border border-border/80 font-mono text-[12px] text-accent-light"
                        >
                          {part.slice(1, -1)}
                        </code>
                      );
                    }
                    // Simple bold formatting
                    if (part.includes('**')) {
                      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
                      return boldParts.map((bPart, bIdx) => {
                        if (bPart.startsWith('**') && bPart.endsWith('**')) {
                          return (
                            <strong key={`b-${bIdx}`} className="font-semibold text-text-primary">
                              {bPart.slice(2, -2)}
                            </strong>
                          );
                        }
                        return bPart;
                      });
                    }
                    return part;
                  })}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`
          relative max-w-[92%] rounded-xl px-4 py-3 text-xs leading-relaxed shadow-sm transition-all
          ${isUser
            ? 'bg-purple-600/90 border border-purple-500/50 text-white rounded-br-xs shadow-purple-950/20'
            : ''
          }
          ${isAssistant
            ? 'bg-surface-200 border border-border text-text-primary rounded-bl-xs shadow-black/20'
            : ''
          }
          ${isSystem
            ? 'bg-surface-200/60 border border-border/60 text-text-muted text-2xs text-center mx-auto max-w-[85%] rounded-lg'
            : ''
          }
        `}
      >
        {/* Role Badge */}
        {!isSystem && (
          <div
            className={`
              text-2xs font-semibold uppercase tracking-wider mb-1.5 flex items-center justify-between gap-2
              ${isUser ? 'text-purple-200' : 'text-accent-light'}
            `}
          >
            <span>{isUser ? 'You' : 'CodeMind AI'}</span>
            <span className={`text-[10px] font-normal ${isUser ? 'text-purple-200/70' : 'text-text-muted'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="break-words font-sans">
          {isAssistant ? (
            renderMarkdownContent(message.content)
          ) : (
            <div className="whitespace-pre-wrap font-sans break-words">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
};
