import { describe, it, expect, beforeEach } from 'vitest';
import { useAIStore } from '../useAIStore';

describe('useAIStore', () => {
  beforeEach(() => {
    // Reset state to initial default session
    useAIStore.setState({
      provider: 'openai',
      isStreaming: false,
      chatSessions: [
        {
          id: 'default',
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
        },
      ],
      activeSessionId: 'default',
    });
  });

  it('initializes with default provider and session', () => {
    const state = useAIStore.getState();
    expect(state.provider).toBe('openai');
    expect(state.isStreaming).toBe(false);
    expect(state.activeSessionId).toBe('default');
  });

  it('switches AI provider', () => {
    useAIStore.getState().setProvider('anthropic');
    expect(useAIStore.getState().provider).toBe('anthropic');

    useAIStore.getState().setProvider('gemini');
    expect(useAIStore.getState().provider).toBe('gemini');
  });

  it('creates and switches active session', () => {
    const newSessionId = useAIStore.getState().createSession('Refactor Auth');
    const state = useAIStore.getState();

    expect(state.activeSessionId).toBe(newSessionId);
    expect(state.chatSessions.some((s) => s.id === newSessionId)).toBe(true);
    expect(state.chatSessions.find((s) => s.id === newSessionId)?.title).toBe('Refactor Auth');
  });

  it('adds user message and updates session title', () => {
    useAIStore.getState().addMessage('default', {
      id: 'msg-1',
      role: 'user',
      content: 'How do I optimize React re-renders?',
      timestamp: Date.now(),
    });

    const session = useAIStore.getState().chatSessions.find((s) => s.id === 'default');
    expect(session?.messages.length).toBe(1);
    expect(session?.title).toBe('How do I optimize React …');
  });

  it('appends text chunks to the last message during streaming', () => {
    useAIStore.getState().addMessage('default', {
      id: 'msg-ai-1',
      role: 'assistant',
      content: 'Hello',
      timestamp: Date.now(),
    });

    useAIStore.getState().appendToLastMessage('default', ' world!');
    const session = useAIStore.getState().chatSessions.find((s) => s.id === 'default');
    expect(session?.messages[0].content).toBe('Hello world!');
  });

  it('deletes session and falls back to another active session', () => {
    const sessionId = useAIStore.getState().createSession('Second Session');
    expect(useAIStore.getState().activeSessionId).toBe(sessionId);

    useAIStore.getState().deleteSession(sessionId);
    expect(useAIStore.getState().activeSessionId).toBe('default');
    expect(useAIStore.getState().chatSessions.some((s) => s.id === sessionId)).toBe(false);
  });
});
