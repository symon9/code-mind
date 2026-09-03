import React, { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '../../types';
import { useEditorStore } from '../../stores/useEditorStore';
import { useToastStore } from '../../stores/useToastStore';

interface ChatMessageProps {
  message: ChatMessageType;
}

// ─── Code Block Renderer with Copy & Apply Actions ──────────────────────────

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const openTabs = useEditorStore((s) => s.openTabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const updateContent = useEditorStore((s) => s.updateContent);
  const addToast = useToastStore((s) => s.addToast);

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToEditor = () => {
    if (!activeTabId || !activeTab) {
      addToast('No active editor tab to apply code to', 'info');
      return;
    }
    updateContent(activeTabId, code);
    setApplied(true);
    addToast(`Applied code to ${activeTab.name}`, 'success');
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-lg border border-slate-700/70 bg-[#0b0f17] font-mono text-xs shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141a27] border-b border-slate-800 text-slate-400">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
          {language || 'code'}
        </span>
        <div className="flex items-center space-x-1.5">
          {/* Apply to Editor Button */}
          <button
            onClick={handleApplyToEditor}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 transition-all"
            title="Replace active tab content with this code"
          >
            {applied ? (
              <>
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400 font-medium">Applied!</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span>Apply to Editor</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded hover:bg-slate-800 hover:text-white transition-colors text-slate-400 border border-slate-700/60"
            title="Copy code to clipboard"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body */}
      <pre className="p-3 overflow-x-auto text-slate-200 leading-relaxed whitespace-pre font-mono text-[12px] scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const renderMarkdownContent = (content: string) => {
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
    parts.push(<CodeBlock key={`code-${match.index}`} language={language} code={code} />);

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.slice(lastIndex);
  if (remainingText) {
    parts.push(renderFormattedText(remainingText, `text-${lastIndex}`));
  }

  return parts;
};

// Formats inline code `code`, bold **text**, and paragraphs
const renderFormattedText = (text: string, keyPrefix: string) => {
  const paragraphs = text.split('\n\n');

  return (
    <div key={keyPrefix} className="space-y-2">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');
        return (
          <p key={`${keyPrefix}-p-${pIdx}`} className="leading-relaxed">
            {lines.map((line, lIdx) => {
              const lineParts = line.split(/(`[^`]+`)/g);
              return (
                <React.Fragment key={`l-${lIdx}`}>
                  {lIdx > 0 && <br />}
                  {lineParts.map((part, partIdx) => {
                    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
                      return (
                        <code
                          key={`c-${partIdx}`}
                          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800 border border-slate-700/80 font-mono text-[11.5px] text-blue-300"
                        >
                          {part.slice(1, -1)}
                        </code>
                      );
                    }
                    if (part.includes('**')) {
                      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
                      return boldParts.map((bPart, bIdx) => {
                        if (bPart.startsWith('**') && bPart.endsWith('**')) {
                          return (
                            <strong key={`b-${bIdx}`} className="font-semibold text-white">
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

// ─── ChatMessage Component ───────────────────────────────────────────────────

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-[#141a27] border border-slate-800 text-slate-400 text-[11px] px-3 py-1.5 rounded-full font-medium shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
      <div
        className={`
          relative max-w-[94%] rounded-xl px-4 py-3 text-xs leading-relaxed shadow-md transition-all
          ${
            isUser
              ? 'bg-indigo-600/25 border border-indigo-500/40 text-slate-100 rounded-br-xs shadow-indigo-950/20'
              : 'bg-[#151c2c] border border-slate-800/90 text-slate-200 rounded-bl-xs shadow-black/30'
          }
        `}
      >
        {/* Role Header */}
        <div
          className={`
            text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between gap-3 border-b pb-1.5
            ${isUser ? 'text-indigo-300 border-indigo-500/30' : 'text-blue-400 border-slate-800'}
          `}
        >
          <div className="flex items-center gap-1.5">
            {isUser ? (
              <span className="w-4 h-4 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-[9px] text-indigo-200">
                👤
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-[9px] text-blue-300">
                ✦
              </span>
            )}
            <span>{isUser ? 'You' : 'CodeMind AI'}</span>
          </div>
          <span className="text-[10px] font-mono font-normal text-slate-500">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Message Content */}
        <div className="break-words font-sans text-xs">
          {isAssistant ? (
            renderMarkdownContent(message.content)
          ) : (
            <div className="whitespace-pre-wrap font-sans break-words text-slate-100">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
};
