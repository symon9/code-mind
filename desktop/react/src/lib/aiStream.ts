import { useAIStore } from '../stores/useAIStore';
import { useAuthStore } from '../stores/useAuthStore';
import type { AIProvider, ChatMessage } from '../types';

// ─── SSE Async Generator with Retry Logic ────────────────────────────────────

export async function* streamAI(
  messages: ChatMessage[],
  provider?: AIProvider,
  options?: Record<string, any>,
  maxAttempts: number = 3
): AsyncGenerator<string, void, unknown> {
  const baseURL = import.meta.env.VITE_API_URL || 'https://code-mind-k63e.onrender.com';
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const token = useAuthStore.getState().token || localStorage.getItem('codemind-auth-token');
      const response = await fetch(`${baseURL}/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages, provider, options }),
      });

      if (!response.ok) {
        throw new Error(`Stream request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === '[DONE]') {
                return;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.chunk) {
                  yield parsed.chunk;
                }
              } catch {
                if (dataStr) {
                  yield dataStr;
                }
              }
            }
          }
        }

        if (buffer.trim().startsWith('data:')) {
          const dataStr = buffer.trim().slice(5).trim();
          if (dataStr && dataStr !== '[DONE]') {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) yield parsed.chunk;
            } catch {
              yield dataStr;
            }
          }
        }

        return; // Success: break loop
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      if (attempt >= maxAttempts) {
        throw err;
      }
      // Exponential backoff before retrying
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }
}

// ─── Store Integration Helper ──────────────────────────────────────────────────

export async function sendAIStreamMessage(
  sessionId: string,
  userContent: string,
  provider?: AIProvider,
  options?: Record<string, any>
): Promise<void> {
  const { addMessage, appendToLastMessage, setStreaming } = useAIStore.getState();

  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    content: userContent,
    timestamp: Date.now(),
  };

  const assistantMsgId = `msg-${Date.now() + 1}-${Math.random().toString(36).slice(2, 8)}`;
  const assistantMsg: ChatMessage = {
    id: assistantMsgId,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
  };

  addMessage(sessionId, userMsg);
  addMessage(sessionId, assistantMsg);
  setStreaming(true);

  // Retrieve full session messages history
  const session = useAIStore.getState().chatSessions.find((s) => s.id === sessionId);
  const messagesHistory = session ? session.messages : [userMsg];
  const activeProvider = provider || useAIStore.getState().provider;

  try {
    const stream = streamAI(messagesHistory, activeProvider, options);
    for await (const chunk of stream) {
      appendToLastMessage(sessionId, chunk);
    }
  } catch (error: any) {
    console.error('Failed to stream AI response:', error);
    appendToLastMessage(
      sessionId,
      `\n\n*[Error: Failed to connect to AI backend (${error?.message || 'Network error'})]*`
    );
  } finally {
    setStreaming(false);
  }
}
