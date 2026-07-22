import { ChatMessage, AIOptions, IAIProvider } from '../types';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements IAIProvider {
  readonly name = 'anthropic';
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  private mapMessages(messages: ChatMessage[]) {
    const system = messages.find((m) => m.role === 'system')?.content;
    const filteredMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));
    return { system, messages: filteredMessages };
  }

  async chat(messages: ChatMessage[], options: AIOptions): Promise<string> {
    const { system, messages: formattedMessages } = this.mapMessages(messages);
    const response = await this.client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature,
      system,
      messages: formattedMessages,
    });

    const firstContent = response.content[0];
    if (firstContent && firstContent.type === 'text') {
      return firstContent.text;
    }
    return '';
  }

  async *stream(messages: ChatMessage[], options: AIOptions): AsyncIterable<string> {
    const { system, messages: formattedMessages } = this.mapMessages(messages);
    const stream = await this.client.messages.create({
      model: options.model || 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature,
      system,
      messages: formattedMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta && 'text' in chunk.delta) {
        yield chunk.delta.text;
      }
    }
  }
}
