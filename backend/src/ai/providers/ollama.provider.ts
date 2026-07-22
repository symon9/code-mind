import { ChatMessage, AIOptions, IAIProvider } from '../types';

export class OllamaProvider implements IAIProvider {
  readonly name = 'ollama';

  constructor(
    private readonly baseUrl: string = 'http://localhost:11434',
    private readonly defaultModel: string = 'llama3',
  ) {}

  async chat(messages: ChatMessage[], options: AIOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  async *stream(messages: ChatMessage[], options: AIOptions): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama stream error: ${response.statusText} (${response.status})`);
    }

    const reader = response.body;
    if (!reader) {
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const processBuffer = function* (textChunk: string) {
      buffer += textChunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const text = parsed.message?.content || '';
          if (text) {
            yield text;
          }
        } catch (e) {
          // ignore
        }
      }
    };

    if (typeof (reader as any)[Symbol.asyncIterator] === 'function') {
      for await (const chunk of reader as any) {
        const textChunk = decoder.decode(chunk, { stream: true });
        yield* processBuffer(textChunk);
      }
    } else {
      const webReader = (reader as any).getReader();
      try {
        while (true) {
          const { done, value } = await webReader.read();
          if (done) break;
          const textChunk = decoder.decode(value, { stream: true });
          yield* processBuffer(textChunk);
        }
      } finally {
        webReader.releaseLock();
      }
    }

    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        const text = parsed.message?.content || '';
        if (text) {
          yield text;
        }
      } catch (e) {
        // ignore
      }
    }
  }
}
