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
    const candidateModels = options.model
      ? [options.model]
      : [
          'gemini-3.8-flash',
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
        ];

    let lastError: any;
    for (const modelName of candidateModels) {
      try {
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
      } catch (err: any) {
        lastError = err;
        // Continue to next candidate model if 404
        if (err?.status === 404 || err?.message?.includes('404')) {
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async *stream(
    messages: ChatMessage[],
    options: AIOptions,
  ): AsyncIterable<string> {
    const { systemInstruction, contents } = this.mapMessages(messages);
    const candidateModels = options.model
      ? [options.model]
      : [
          'gemini-3.8-flash',
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
        ];

    let streamResult: any;
    let lastError: any;

    for (const modelName of candidateModels) {
      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          systemInstruction,
        });

        streamResult = await model.generateContentStream({
          contents,
          generationConfig: {
            temperature: options.temperature,
            maxOutputTokens: options.maxTokens,
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        if (err?.status === 404 || err?.message?.includes('404')) {
          continue;
        }
        throw err;
      }
    }

    if (!streamResult) {
      throw lastError;
    }

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
}
