import { ChatMessage, AIOptions, IAIProvider } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements IAIProvider {
  readonly name = 'gemini';
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  private mapMessages(messages: ChatMessage[]) {
    const system = messages.find((m) => m.role === 'system')?.content;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
    return { systemInstruction: system, contents };
  }

  async chat(messages: ChatMessage[], options: AIOptions): Promise<string> {
    const { systemInstruction, contents } = this.mapMessages(messages);
    const modelName = options.model || 'gemini-1.5-flash';

    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    });

    return result.response?.text() || '';
  }

  async *stream(messages: ChatMessage[], options: AIOptions): AsyncIterable<string> {
    const { systemInstruction, contents } = this.mapMessages(messages);
    const modelName = options.model || 'gemini-1.5-flash';

    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction,
    });

    const result = await model.generateContentStream({
      contents,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
}
