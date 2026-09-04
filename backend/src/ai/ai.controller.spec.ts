import { Test, TestingModule } from '@nestjs/testing';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AIController', () => {
  let controller: AIController;
  let service: AIService;

  const mockAIService = {
    chat: jest.fn().mockResolvedValue({
      content: 'Chat response',
      provider: 'openai',
      model: 'gpt-4o',
      tokensUsed: 10,
    }),
    stream: jest.fn().mockImplementation(async function* () {
      yield { chunk: 'Hello' };
      yield { chunk: ' world' };
      yield {
        metadata: {
          provider: 'openai',
          model: 'gpt-4o',
          promptTokens: 5,
          completionTokens: 5,
        },
      };
    }),
    executeAction: jest.fn().mockResolvedValue({
      result: 'Action result',
      action: 'explain',
      provider: 'openai',
    }),
  };

  const mockJwtService = {};
  const mockConfigService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIController],
      providers: [
        { provide: AIService, useValue: mockAIService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // bypass auth for test simplicity
      .compile();

    controller = module.get<AIController>(AIController);
    service = module.get<AIService>(AIService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('chat', () => {
    it('should call service.chat', async () => {
      const body = { messages: [{ role: 'user' as const, content: 'hi' }] };
      const req = { user: { sub: 'user-123' } };
      const result = await controller.chat(req, body);
      expect(result).toEqual({
        content: 'Chat response',
        provider: 'openai',
        model: 'gpt-4o',
        tokensUsed: 10,
      });
      expect(mockAIService.chat).toHaveBeenCalledWith(
        'user-123',
        body.messages,
        {},
        undefined,
      );
    });
  });

  describe('actions', () => {
    it('should call service.executeAction', async () => {
      const body = {
        action: 'explain',
        code: 'const x = 1;',
        language: 'javascript',
      };
      const req = { user: { sub: 'user-123' } };
      const result = await controller.actions(req, body);
      expect(result).toEqual({
        result: 'Action result',
        action: 'explain',
        provider: 'openai',
      });
      expect(mockAIService.executeAction).toHaveBeenCalledWith(
        'user-123',
        'explain',
        'const x = 1;',
        'javascript',
        undefined,
        undefined,
      );
    });
  });

  describe('stream', () => {
    it('should emit chunks and metadata', (done) => {
      const body = { messages: [{ role: 'user' as const, content: 'hi' }] };
      const req = { user: { sub: 'user-123' } };
      const events: any[] = [];

      controller.stream(req, body).subscribe({
        next: (event) => events.push(event),
        error: (err) => done(err),
        complete: () => {
          expect(events).toEqual([
            { data: { chunk: 'Hello' } },
            { data: { chunk: ' world' } },
            {
              data: {
                metadata: {
                  provider: 'openai',
                  model: 'gpt-4o',
                  promptTokens: 5,
                  completionTokens: 5,
                },
              },
              type: 'metadata',
            },
          ]);
          done();
        },
      });
    });
  });
});
