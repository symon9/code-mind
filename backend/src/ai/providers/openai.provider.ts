import { ChatMessage, AIOptions, IAIProvider } from '../types';
import OpenAI from 'openai';

export class OpenAIProvider implements IAIProvider {
  readonly name = 'openai';
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async chat(messages: ChatMessage[], options: AIOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  async *stream(messages: ChatMessage[], options: AIOptions): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        yield text;
      }
    }
  }
}
