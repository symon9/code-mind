export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface IAIProvider {
  name: string;
  chat(messages: ChatMessage[], options: AIOptions): Promise<string>;
  stream(messages: ChatMessage[], options: AIOptions): AsyncIterable<string>;
}
