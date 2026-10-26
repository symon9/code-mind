import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatMessage, AIOptions, IAIProvider } from './types';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { decryptText } from '../common/crypto.util';

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

    const ollamaUrl =
      this.configService.get<string>('OLLAMA_BASE_URL') ||
      'http://localhost:11434';
    const ollamaModel =
      this.configService.get<string>('OLLAMA_MODEL') || 'llama3';
    this.providers.set('ollama', new OllamaProvider(ollamaUrl, ollamaModel));
  }

  private async resolveProviderInstance(
    userId: string,
    providerName: string,
    options?: AIOptions,
  ): Promise<{ provider: IAIProvider; isUserKey: boolean } | null> {
    const normalized = providerName.toLowerCase();

    // 1. Explicit request-level key override (ephemeral BYOK)
    if (options?.apiKey) {
      if (normalized === 'anthropic') {
        return { provider: new AnthropicProvider(options.apiKey), isUserKey: true };
      }
      if (normalized === 'openai') {
        return { provider: new OpenAIProvider(options.apiKey), isUserKey: true };
      }
      if (normalized === 'gemini') {
        return { provider: new GeminiProvider(options.apiKey), isUserKey: true };
      }
    }
    if (normalized === 'ollama' && options?.ollamaUrl) {
      return {
        provider: new OllamaProvider(options.ollamaUrl, options.model || 'llama3'),
        isUserKey: true,
      };
    }

    // 2. User's saved BYOK preference key (encrypted at rest)
    try {
      const pref = await this.prisma.preference.findUnique({
        where: { userId },
      });
      if (pref) {
        if (normalized === 'openai' && (pref as any).openaiApiKey) {
          const key = decryptText((pref as any).openaiApiKey);
          if (key) return { provider: new OpenAIProvider(key), isUserKey: true };
        }
        if (normalized === 'anthropic' && (pref as any).anthropicApiKey) {
          const key = decryptText((pref as any).anthropicApiKey);
          if (key) return { provider: new AnthropicProvider(key), isUserKey: true };
        }
        if (normalized === 'gemini' && (pref as any).geminiApiKey) {
          const key = decryptText((pref as any).geminiApiKey);
          if (key) return { provider: new GeminiProvider(key), isUserKey: true };
        }
        if (normalized === 'ollama' && (pref as any).ollamaUrl) {
          return {
            provider: new OllamaProvider((pref as any).ollamaUrl, options?.model || 'llama3'),
            isUserKey: true,
          };
        }
      }
    } catch {
      // Ignore preference lookup error and continue to server key
    }

    // 3. Fall back to server environment key
    const serverProvider = this.providers.get(normalized);
    if (serverProvider) {
      return { provider: serverProvider, isUserKey: false };
    }

    return null;
  }

  private async checkServerQuota(userId: string): Promise<void> {
    if (typeof (this.prisma as any).aIRequest?.count !== 'function') {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.prisma.aIRequest.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    const dailyLimit = parseInt(
      this.configService.get<string>('AI_DAILY_FREE_LIMIT') || '50',
      10,
    );

    if (count >= dailyLimit) {
      throw new ForbiddenException(
        `Daily free AI request limit reached (${dailyLimit}/day). Add your own API key in Settings -> AI to unlock unlimited requests.`,
      );
    }
  }

  private async getProvidersToTry(
    userId: string,
    requestedProvider?: string,
    options?: AIOptions,
  ): Promise<{ name: string; defaultModel: string }[]> {
    const allProvidersInfo = [
      { name: 'anthropic', defaultModel: 'claude-3-5-sonnet-20241022' },
      { name: 'openai', defaultModel: 'gpt-4o' },
      { name: 'gemini', defaultModel: 'gemini-1.5-flash' },
      { name: 'ollama', defaultModel: 'llama3' },
    ];

    if (requestedProvider) {
      const info = allProvidersInfo.find((p) => p.name === requestedProvider);
      const resolved = await this.resolveProviderInstance(
        userId,
        requestedProvider,
        options,
      );
      if (!info || !resolved) {
        throw new InternalServerErrorException(
          `Requested AI provider '${requestedProvider}' is not configured or unavailable.`,
        );
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

    if (preferredProvider) {
      const resolved = await this.resolveProviderInstance(
        userId,
        preferredProvider,
        options,
      );
      if (resolved) {
        const prefInfo = allProvidersInfo.find(
          (p) => p.name === preferredProvider,
        );
        if (prefInfo) {
          chain.push(prefInfo);
          added.add(preferredProvider);
        }
      }
    }

    for (const providerName of this.priorityChain) {
      if (!added.has(providerName)) {
        const resolved = await this.resolveProviderInstance(
          userId,
          providerName,
          options,
        );
        if (resolved) {
          const info = allProvidersInfo.find((p) => p.name === providerName);
          if (info) {
            chain.push(info);
            added.add(providerName);
          }
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
  ): Promise<{
    content: string;
    provider: string;
    model: string;
    tokensUsed: number;
  }> {
    const providersToTry = await this.getProvidersToTry(
      userId,
      requestedProvider,
      options,
    );
    if (providersToTry.length === 0) {
      throw new InternalServerErrorException(
        'All AI providers are currently unavailable',
      );
    }

    let lastError: any = null;
    for (const providerInfo of providersToTry) {
      try {
        const resolved = await this.resolveProviderInstance(
          userId,
          providerInfo.name,
          options,
        );
        if (!resolved) continue;

        if (!resolved.isUserKey) {
          await this.checkServerQuota(userId);
        }

        const provider = resolved.provider;
        const model = this.mapModel(
          providerInfo.name,
          options.model || providerInfo.defaultModel,
        );

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
        console.error(
          `AI provider '${providerInfo.name}' failed. Falling back. Error:`,
          err,
        );
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
  ): AsyncIterable<{
    chunk: string;
    metadata?: {
      provider: string;
      model: string;
      promptTokens: number;
      completionTokens: number;
    };
  }> {
    const providersToTry = await this.getProvidersToTry(
      userId,
      requestedProvider,
      options,
    );
    if (providersToTry.length === 0) {
      throw new InternalServerErrorException(
        'All AI providers are currently unavailable',
      );
    }

    let lastError: any = null;
    let success = false;
    let chosenProviderName = '';
    let chosenModelName = '';
    let fullResponse = '';

    for (const providerInfo of providersToTry) {
      try {
        const resolved = await this.resolveProviderInstance(
          userId,
          providerInfo.name,
          options,
        );
        if (!resolved) continue;

        if (!resolved.isUserKey) {
          await this.checkServerQuota(userId);
        }

        const provider = resolved.provider;
        const model = this.mapModel(
          providerInfo.name,
          options.model || providerInfo.defaultModel,
        );

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
        console.error(
          `AI stream provider '${providerInfo.name}' failed. Falling back. Error:`,
          err,
        );
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

  private buildSystemPrompt(
    action: string,
    language: string,
    context?: string,
  ): string {
    const langContext = language ? `The code is written in ${language}.` : '';
    const additionalContext = context
      ? `Additional context or instructions: ${context}`
      : '';

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

  async testProviderConnection(
    providerName: string,
    apiKey?: string,
    ollamaUrl?: string,
    model?: string,
  ): Promise<{
    success: boolean;
    provider: string;
    model: string;
    latencyMs: number;
    message: string;
  }> {
    const startTime = Date.now();
    const normalized = providerName.toLowerCase();

    let tempProvider: IAIProvider;
    let testModel = model;

    if (normalized === 'anthropic') {
      const key = apiKey || this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!key) {
        throw new BadRequestException('Anthropic API key is required');
      }
      tempProvider = new AnthropicProvider(key);
      testModel = testModel || 'claude-3-5-sonnet-20241022';
    } else if (normalized === 'openai') {
      const key = apiKey || this.configService.get<string>('OPENAI_API_KEY');
      if (!key) {
        throw new BadRequestException('OpenAI API key is required');
      }
      tempProvider = new OpenAIProvider(key);
      testModel = testModel || 'gpt-4o-mini';
    } else if (normalized === 'gemini') {
      const key = apiKey || this.configService.get<string>('GEMINI_API_KEY');
      if (!key) {
        throw new BadRequestException('Gemini API key is required');
      }
      tempProvider = new GeminiProvider(key);
      testModel = testModel || 'gemini-3.8-flash';
    } else if (normalized === 'ollama') {
      const url =
        ollamaUrl ||
        this.configService.get<string>('OLLAMA_BASE_URL') ||
        'http://localhost:11434';
      const defaultModel =
        this.configService.get<string>('OLLAMA_MODEL') || 'llama3';
      testModel = testModel || defaultModel;
      tempProvider = new OllamaProvider(url, testModel);
    } else {
      throw new BadRequestException(`Unknown provider '${providerName}'`);
    }

    try {
      const pingMessage: ChatMessage[] = [{ role: 'user', content: 'Ping' }];
      const result = await tempProvider.chat(pingMessage, {
        model: testModel,
        maxTokens: 10,
      });
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        provider: normalized,
        model: testModel,
        latencyMs,
        message: `Connected successfully (${result.slice(0, 20).trim() || 'OK'})`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        provider: normalized,
        model: testModel || 'default',
        latencyMs,
        message: err?.message || 'Connection test failed',
      };
    }
  }
}
