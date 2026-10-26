import { create } from 'zustand';
import type { AIProvider, ChatMessage, ChatSession } from '../types';
import { useSettingsStore } from './useSettingsStore';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface AIState {
  provider: AIProvider;
  isStreaming: boolean;
  chatSessions: ChatSession[];
  activeSessionId: string | null;
}

interface AIActions {
  addMessage: (sessionId: string, message: ChatMessage) => void;
  appendToLastMessage: (sessionId: string, chunk: string) => void;
  createSession: (title?: string) => string;
  setActiveSession: (id: string) => void;
  setProvider: (provider: AIProvider) => void;
  setStreaming: (streaming: boolean) => void;
  clearSession: (id: string) => void;
  deleteSession: (id: string) => void;
}

type AIStore = AIState & AIActions;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const defaultSession: ChatSession = {
  id: 'default',
  title: 'New Chat',
  messages: [
    {
      id: generateMessageId(),
      role: 'system',
      content: 'CodeMind AI assistant is ready. Ask me anything about your code.',
      timestamp: Date.now(),
    },
  ],
  createdAt: Date.now(),
};

// Read the persisted provider from SettingsStore so user's saved choice is respected
const initialProvider = useSettingsStore.getState().aiProvider || 'openai';

export const useAIStore = create<AIStore>((set, get) => ({
  provider: initialProvider,
  isStreaming: false,
  chatSessions: [defaultSession],
  activeSessionId: 'default',

  addMessage: (sessionId: string, message: ChatMessage) => {
    set((state) => ({
      chatSessions: state.chatSessions.map((session) => {
        if (session.id !== sessionId) return session;
        // Update session title automatically on first user message if title is default
        const isFirstUserMsg = session.messages.filter((m) => m.role === 'user').length === 0 && message.role === 'user';
        const newTitle = isFirstUserMsg ? message.content.slice(0, 24) + (message.content.length > 24 ? '…' : '') : session.title;
        return {
          ...session,
          title: newTitle,
          messages: [...session.messages, message],
        };
      }),
    }));
  },

  appendToLastMessage: (sessionId: string, chunk: string) => {
    set((state) => ({
      chatSessions: state.chatSessions.map((session) => {
        if (session.id !== sessionId || session.messages.length === 0) return session;
        const lastIdx = session.messages.length - 1;
        const lastMsg = session.messages[lastIdx];

        const updatedMessages = [...session.messages];
        updatedMessages[lastIdx] = {
          ...lastMsg,
          content: lastMsg.content + chunk,
        };

        return {
          ...session,
          messages: updatedMessages,
        };
      }),
    }));
  },

  createSession: (title?: string) => {
    const id = generateSessionId();
    const session: ChatSession = {
      id,
      title: title || 'New Chat',
      messages: [
        {
          id: generateMessageId(),
          role: 'system',
          content: 'CodeMind AI assistant is ready. Ask me anything about your code.',
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };

    set((state) => ({
      chatSessions: [...state.chatSessions, session],
      activeSessionId: id,
    }));

    return id;
  },

  setActiveSession: (id: string) => {
    const { chatSessions } = get();
    if (chatSessions.some((s) => s.id === id)) {
      set({ activeSessionId: id });
    }
  },

  setProvider: (provider: AIProvider) => {
    set({ provider });
  },

  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  clearSession: (id: string) => {
    set((state) => ({
      chatSessions: state.chatSessions.map((session) =>
        session.id === id
          ? {
              ...session,
              messages: [
                {
                  id: generateMessageId(),
                  role: 'system' as const,
                  content: 'Chat cleared. CodeMind AI assistant is ready.',
                  timestamp: Date.now(),
                },
              ],
            }
          : session
      ),
    }));
  },

  deleteSession: (id: string) => {
    set((state) => {
      const filtered = state.chatSessions.filter((s) => s.id !== id);
      let newActiveId = state.activeSessionId;

      if (state.activeSessionId === id) {
        newActiveId = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
      }

      return { chatSessions: filtered, activeSessionId: newActiveId };
    });
  },
}));
