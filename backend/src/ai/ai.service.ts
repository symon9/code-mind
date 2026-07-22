import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatMessage, AIOptions, IAIProvider } from './types';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Injectable()
export class AIService {
  private readonly providers = new Map<string, IAIProvider>();
  private readonly priorityChain = ['anthropic', 'openai', 'gemini', 'ollama'];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.providers.set('anthropic', new AnthropicProvider(anthropicKey));
    }

    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.providers.set('openai', new OpenAIProvider(openaiKey));
    }

    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      this.providers.set('gemini', new GeminiProvider(geminiKey));
    }

    const ollamaUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    const ollamaModel = this.configService.get<string>('OLLAMA_MODEL') || 'llama3';
    this.providers.set('ollama', new OllamaProvider(ollamaUrl, ollamaModel));
  }

  private async getProvidersToTry(userId: string, requestedProvider?: string): Promise<{ name: string; defaultModel: string }[]> {
    const allProvidersInfo = [
      { name: 'anthropic', defaultModel: 'claude-3-5-sonnet-20241022' },
      { name: 'openai', defaultModel: 'gpt-4o' },
      { name: 'gemini', defaultModel: 'gemini-1.5-flash' },
      { name: 'ollama', defaultModel: 'llama3' },
    ];

    if (requestedProvider) {
      const info = allProvidersInfo.find((p) => p.name === requestedProvider);
      if (!info || !this.providers.has(requestedProvider)) {
        throw new InternalServerErrorException(`Requested AI provider '${requestedProvider}' is not configured or unavailable.`);
      }
      return [info];
    }

    let preferredProvider: string | undefined;
    try {
      const preference = await this.prisma.preference.findUnique({
        where: { userId },
      });
      if (preference && preference.aiProvider) {
        preferredProvider = preference.aiProvider.toLowerCase();
      }
    } catch (e) {
      // Ignore preference lookup error, continue with default chain
    }

    const chain: { name: string; defaultModel: string }[] = [];
    const added = new Set<string>();

    if (preferredProvider && this.providers.has(preferredProvider)) {
      const prefInfo = allProvidersInfo.find((p) => p.name === preferredProvider);
      if (prefInfo) {
        chain.push(prefInfo);
        added.add(preferredProvider);
      }
    }

    for (const providerName of this.priorityChain) {
      if (!added.has(providerName) && this.providers.has(providerName)) {
        const info = allProvidersInfo.find((p) => p.name === providerName);
        if (info) {
          chain.push(info);
          added.add(providerName);
        }
      }
    }

    return chain;
  }

  private mapModel(providerName: string, model?: string): string {
    if (providerName === 'anthropic') {
      if (!model || model === 'claude-sonnet-4-6') {
        return 'claude-3-5-sonnet-20241022';
      }
      return model;
    }
    if (providerName === 'openai') {
      return model || 'gpt-4o';
    }
    if (providerName === 'gemini') {
      return model || 'gemini-1.5-flash';
    }
    if (providerName === 'ollama') {
      return model || 'llama3';
    }
    return model || '';
  }

  async chat(
    userId: string,
    messages: ChatMessage[],
    options: AIOptions,
    requestedProvider?: string,
  ): Promise<{ content: string; provider: string; model: string; tokensUsed: number }> {
    const providersToTry = await this.getProvidersToTry(userId, requestedProvider);
    if (providersToTry.length === 0) {
      throw new InternalServerErrorException('All AI providers are currently unavailable');
    }

    let lastError: any = null;
    for (const providerInfo of providersToTry) {
      try {
        const provider = this.providers.get(providerInfo.name)!;
        const model = this.mapModel(providerInfo.name, options.model || providerInfo.defaultModel);
        
        const content = await provider.chat(messages, { ...options, model });

        const promptText = messages.map((m) => m.content).join('\n');
        const promptTokens = Math.ceil(promptText.length / 4);
        const completionTokens = Math.ceil(content.length / 4);
        const tokensUsed = promptTokens + completionTokens;

        await this.prisma.aIRequest.create({
          data: {
            userId,
            provider: providerInfo.name,
            model,
            promptTokens,
            completionTokens,
          },
        });

        return {
          content,
          provider: providerInfo.name,
          model,
          tokensUsed,
        };
      } catch (err) {
        lastError = err;
        if (requestedProvider) {
          throw err;
        }
        console.error(`AI provider '${providerInfo.name}' failed. Falling back. Error:`, err);
      }
    }

    throw new InternalServerErrorException(
      'All AI providers are currently unavailable',
    );
  }

  async *stream(
    userId: string,
    messages: ChatMessage[],
    options: AIOptions,
    requestedProvider?: string,
  ): AsyncIterable<{ chunk: string; metadata?: { provider: string; model: string; promptTokens: number; completionTokens: number } }> {
    const providersToTry = await this.getProvidersToTry(userId, requestedProvider);
    if (providersToTry.length === 0) {
      throw new InternalServerErrorException('All AI providers are currently unavailable');
    }

    let lastError: any = null;
    let success = false;
    let chosenProviderName = '';
    let chosenModelName = '';
    let fullResponse = '';

    for (const providerInfo of providersToTry) {
      try {
        const provider = this.providers.get(providerInfo.name)!;
        const model = this.mapModel(providerInfo.name, options.model || providerInfo.defaultModel);

        const stream = provider.stream(messages, { ...options, model });

        const iterator = stream[Symbol.asyncIterator]();
        const firstResult = await iterator.next();

        success = true;
        chosenProviderName = providerInfo.name;
        chosenModelName = model;

        if (!firstResult.done) {
          fullResponse += firstResult.value;
          yield { chunk: firstResult.value };

          while (true) {
            const result = await iterator.next();
            if (result.done) break;
            fullResponse += result.value;
            yield { chunk: result.value };
          }
        }
        break;
      } catch (err) {
        lastError = err;
        if (requestedProvider) {
          throw err;
        }
        console.error(`AI stream provider '${providerInfo.name}' failed. Falling back. Error:`, err);
      }
    }

    if (!success) {
      throw new InternalServerErrorException(
        'All AI providers are currently unavailable',
      );
    }

    const promptText = messages.map((m) => m.content).join('\n');
    const promptTokens = Math.ceil(promptText.length / 4);
    const completionTokens = Math.ceil(fullResponse.length / 4);

    try {
      await this.prisma.aIRequest.create({
        data: {
          userId,
          provider: chosenProviderName,
          model: chosenModelName,
          promptTokens,
          completionTokens,
        },
      });
    } catch (dbErr) {
      console.error('Failed to log streaming AIRequest:', dbErr);
    }

    yield {
      chunk: '',
      metadata: {
        provider: chosenProviderName,
        model: chosenModelName,
        promptTokens,
        completionTokens,
      },
    };
  }

  private buildSystemPrompt(action: string, language: string, context?: string): string {
    const langContext = language ? `The code is written in ${language}.` : '';
    const additionalContext = context ? `Additional context or instructions: ${context}` : '';

    switch (action) {
      case 'explain':
        return `You are an expert developer assistant. Explain the provided code clearly and concisely. Break down its logic, purpose, inputs/outputs, and complex parts.\n${langContext}\n${additionalContext}`;
      case 'refactor':
        return `You are an expert developer assistant. Refactor the provided code to improve readability, structure, and maintainability while keeping its behavior identical. Explain your modifications.\n${langContext}\n${additionalContext}`;
      case 'debug':
        return `You are an expert developer assistant. Analyze the provided code for bugs, errors, security flaws, or edge cases. Present the problems and supply corrected code.\n${langContext}\n${additionalContext}`;
      case 'generate':
        return `You are an expert developer assistant. Generate the requested code based on the instructions and language requirements.\n${langContext}\n${additionalContext}`;
      case 'optimize':
        return `You are an expert developer assistant. Optimize the provided code for speed, memory, or computational efficiency. Explain the runtime complexity (Big O) improvements.\n${langContext}\n${additionalContext}`;
      case 'test':
        return `You are an expert developer assistant. Generate comprehensive unit tests (including happy path and edge cases) for the provided code.\n${langContext}\n${additionalContext}`;
      case 'docs':
        return `You are an expert developer assistant. Document the provided code by adding clean comments, JSDocs, docstrings, or generating a Markdown overview.\n${langContext}\n${additionalContext}`;
      case 'review':
        return `You are an expert developer assistant. Perform a rigorous code review. Highlight code smell, readability, performance, security issues, and suggest concrete fixes.\n${langContext}\n${additionalContext}`;
      case 'convert':
        return `You are an expert developer assistant. Translate or convert the provided code into another language or library format as specified.\n${langContext}\n${additionalContext}`;
      case 'comment':
        return `You are an expert developer assistant. Add concise, informative inline comments to the provided code to explain how the code works.\n${langContext}\n${additionalContext}`;
      case 'continue':
        return `You are an expert developer assistant. Continue writing or extending the provided code fragment organically based on its existing style and instructions.\n${langContext}\n${additionalContext}`;
      case 'summarize':
        return `You are an expert developer assistant. Summarize the provided code briefly, explaining its high-level architecture and responsibilities.\n${langContext}\n${additionalContext}`;
      default:
        return `You are an expert developer assistant.\n${langContext}\n${additionalContext}`;
    }
  }

  async executeAction(
    userId: string,
    action: string,
    code: string,
    language: string,
    context?: string,
    provider?: string,
  ): Promise<{ result: string; action: string; provider: string }> {
    const systemPrompt = this.buildSystemPrompt(action, language, context);
    const userPrompt = `Code to process:\n\`\`\`${language || ''}\n${code}\n\`\`\``;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const chatResponse = await this.chat(userId, messages, {}, provider);

    return {
      result: chatResponse.content,
      action,
      provider: chatResponse.provider,
    };
  }
}
