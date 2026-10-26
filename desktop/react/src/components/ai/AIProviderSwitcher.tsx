import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAIStore } from '../../stores/useAIStore';
import { useToastStore } from '../../stores/useToastStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { API_BASE_URL } from '../../utils/api';
import type { AIProvider } from '../../types';

interface ProviderOption {
  id: AIProvider;
  name: string;
  badge: string;
  badgeBg: string;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    badge: 'Claude',
    badgeBg: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o)',
    badge: 'OpenAI',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Gemini',
    badgeBg: 'bg-sky-500/20 border-sky-500/30 text-sky-300',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local LLM)',
    badge: 'Ollama',
    badgeBg: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
  },
];

const getProviderDisplayName = (provider: AIProvider): string => {
  switch (provider) {
    case 'anthropic':
      return 'Anthropic';
    case 'openai':
      return 'OpenAI';
    case 'ollama':
      return 'Ollama';
    case 'gemini':
      return 'Gemini';
    default:
      return String(provider);
  }
};

interface AIProviderSwitcherProps {
  compact?: boolean;
  dropUp?: boolean;
}

export const AIProviderSwitcher: React.FC<AIProviderSwitcherProps> = ({
  compact = false,
  dropUp = false,
}) => {
  const currentProvider = useSettingsStore((s) => s.aiProvider);
  const setSettingsProvider = useSettingsStore((s) => s.setAIProvider);
  const setAIStoreProvider = useAIStore((s) => s.setProvider);
  const addToast = useToastStore((s) => s.addToast);
  const token = useAuthStore((s) => s.token);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (provider: AIProvider) => {
    setIsOpen(false);
    if (provider === currentProvider) return;

    const providerDisplayName = getProviderDisplayName(provider);

    // Optimistic store update
    setSettingsProvider(provider);
    setAIStoreProvider(provider);

    // Show toast notification immediately
    addToast(`Switched to ${providerDisplayName}`, 'info');

    // Patch backend preferences
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`${API_BASE_URL}/users/me/preferences`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ aiProvider: provider }),
      });
    } catch (err) {
      console.warn('[AIProviderSwitcher] Backend preferences sync skipped/failed:', err);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          flex items-center gap-1.5 rounded transition-all duration-150
          ${compact
            ? 'px-2 py-0.5 text-xs hover:bg-surface-300/60'
            : 'px-2 py-1 text-xs font-medium bg-surface-200 hover:bg-surface-300 border border-border text-text-primary'
          }
        `}
        title="Switch AI Provider"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="capitalize">{getProviderDisplayName(currentProvider)}</span>
        <svg
          className={`w-3 h-3 text-text-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`
            absolute right-0 z-50 w-48 rounded-lg shadow-xl
            bg-surface-200 border border-border py-1 text-xs animate-fade-in
            ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}
          `}
        >
          <div className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-text-muted border-b border-border/50">
            Select AI Provider
          </div>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-300 transition-colors
                ${p.id === currentProvider ? 'text-accent font-semibold bg-accent/10' : 'text-text-primary'}
              `}
            >
              <span>{p.name}</span>
              {p.id === currentProvider && (
                <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
