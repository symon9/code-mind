import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Mock Anthropic
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: jest.fn().mockImplementation(async (args) => {
          if (args.stream) {
            return (async function* () {
              yield { type: 'content_block_delta', delta: { text: 'Anth' } };
              yield { type: 'content_block_delta', delta: { text: 'ropic' } };
            })();
          }
          return {
            content: [{ type: 'text', text: 'Anthropic response' }],
          };
        }),
      },
    };
  });
});

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async (args) => {
            if (args.stream) {
              return (async function* () {
                yield { choices: [{ delta: { content: 'Open' } }] };
                yield { choices: [{ delta: { content: 'AI' } }] };
              })();
            }
            return {
              choices: [{ message: { content: 'OpenAI response' } }],
            };
          }),
        },
      },
    };
  });
});

// Mock Gemini
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            generateContent: jest.fn().mockResolvedValue({
              response: {
                text: () => 'Gemini response',
              },
            }),
            generateContentStream: jest.fn().mockImplementation(async () => {
              return {
                stream: (async function* () {
                  yield { text: () => 'Gem' };
                  yield { text: () => 'ini' };
                })(),
              };
            }),
          };
        }),
      };
    }),
  };
});

describe('AIService', () => {
  let service: AIService;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    preference: {
      findUnique: jest.fn(),
    },
    aIRequest: {
      create: jest.fn().mockResolvedValue({ id: 'req-1' }),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ANTHROPIC_API_KEY') return 'sk-ant-test';
      if (key === 'OPENAI_API_KEY') return 'sk-or-test';
      if (key === 'GEMINI_API_KEY') return 'sk-gem-test';
      if (key === 'OLLAMA_BASE_URL') return 'http://localhost:11434';
      if (key === 'OLLAMA_MODEL') return 'llama3';
      return null;
    }),
  };

  // Mock global fetch for Ollama provider tests
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(async () => {
    // Reset fetch mock
    global.fetch = jest.fn().mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ message: { content: 'Ollama response' } }),
      } as any;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should route directly to explicit provider (openai) and skip fallback', async () => {
      const response = await service.chat(
        'user-1',
        [{ role: 'user', content: 'hi' }],
        {},
        'openai',
      );
      expect(response.provider).toBe('openai');
      expect(response.content).toBe('OpenAI response');
      expect(mockPrismaService.aIRequest.create).toHaveBeenCalled();
    });

    it('should route directly to explicit provider (anthropic) and skip fallback', async () => {
      const response = await service.chat(
        'user-1',
        [{ role: 'user', content: 'hi' }],
        {},
        'anthropic',
      );
      expect(response.provider).toBe('anthropic');
      expect(response.content).toBe('Anthropic response');
    });

    it('should route directly to explicit provider (gemini) and skip fallback', async () => {
      const response = await service.chat(
        'user-1',
        [{ role: 'user', content: 'hi' }],
        {},
        'gemini',
      );
      expect(response.provider).toBe('gemini');
      expect(response.content).toBe('Gemini response');
    });

    it('should use preferred provider from database if no provider specified', async () => {
      mockPrismaService.preference.findUnique.mockResolvedValue({
        aiProvider: 'openai',
      });

      const response = await service.chat(
        'user-1',
        [{ role: 'user', content: 'hi' }],
        {},
      );
      expect(response.provider).toBe('openai');
      expect(response.content).toBe('OpenAI response');
      expect(mockPrismaService.preference.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should fallback to next in priority chain (openai) if preferred (anthropic) fails', async () => {
      mockPrismaService.preference.findUnique.mockResolvedValue({
        aiProvider: 'anthropic',
      });

      // Mock Anthropic client to fail in this test
      const anthropicProvider = (service as any).providers.get('anthropic');
      jest
        .spyOn(anthropicProvider, 'chat')
        .mockRejectedValueOnce(new Error('Anthropic Rate Limit'));

      const response = await service.chat(
        'user-1',
        [{ role: 'user', content: 'hi' }],
        {},
      );
      expect(response.provider).toBe('openai');
      expect(response.content).toBe('OpenAI response');
    });

    it('should throw clear error if all providers fail', async () => {
      const anthropicProvider = (service as any).providers.get('anthropic');
      const openaiProvider = (service as any).providers.get('openai');
      const geminiProvider = (service as any).providers.get('gemini');
      const ollamaProvider = (service as any).providers.get('ollama');

      jest
        .spyOn(anthropicProvider, 'chat')
        .mockRejectedValue(new Error('Anth error'));
      jest
        .spyOn(openaiProvider, 'chat')
        .mockRejectedValue(new Error('OpenAI error'));
      jest
        .spyOn(geminiProvider, 'chat')
        .mockRejectedValue(new Error('Gemini error'));
      jest
        .spyOn(ollamaProvider, 'chat')
        .mockRejectedValue(new Error('Ollama error'));

      await expect(
        service.chat('user-1', [{ role: 'user', content: 'hi' }], {}),
      ).rejects.toThrow('All AI providers are currently unavailable');
    });
  });

  describe('executeAction', () => {
    it('should execute review action and format prompt correctly', async () => {
      const response = await service.executeAction(
        'user-1',
        'review',
        'const a = 1;',
        'javascript',
        'make it simple',
      );
      expect(response.action).toBe('review');
      expect(response.provider).toBe('anthropic'); // defaults to anthropic
      expect(response.result).toBe('Anthropic response');
    });
  });
});
