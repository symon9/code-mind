import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: PrismaService;

  const mockPrismaService = {
    project: {
      findUnique: jest.fn(),
    },
    chatSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create session without project ID', async () => {
      const mockSession = {
        id: 'session-1',
        title: 'New Chat',
        userId: 'user-1',
        projectId: null,
      };
      mockPrismaService.chatSession.create.mockResolvedValue(mockSession);

      const result = await service.createSession('user-1', {
        title: 'New Chat',
      });
      expect(result).toEqual(mockSession);
      expect(mockPrismaService.chatSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          projectId: null,
          title: 'New Chat',
        },
      });
    });

    it('should create session with project ID if owner matches', async () => {
      const mockProject = { id: 'project-1', userId: 'user-1' };
      const mockSession = {
        id: 'session-1',
        title: 'P1 Chat',
        userId: 'user-1',
        projectId: 'project-1',
      };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.chatSession.create.mockResolvedValue(mockSession);

      const result = await service.createSession('user-1', {
        title: 'P1 Chat',
        projectId: 'project-1',
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw ForbiddenException if project is owned by another user', async () => {
      const mockProject = { id: 'project-1', userId: 'user-2' };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      await expect(
        service.createSession('user-1', {
          title: 'P1 Chat',
          projectId: 'project-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listSessions', () => {
    it('should list user sessions sorted by updatedAt desc', async () => {
      const mockSessions = [{ id: 'session-1', title: 'New Chat' }];
      mockPrismaService.chatSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.listSessions('user-1');
      expect(result).toEqual(mockSessions);
      expect(mockPrismaService.chatSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getMessages', () => {
    it('should get session messages if owned by user', async () => {
      const mockSession = { id: 'session-1', userId: 'user-1' };
      const mockMessages = [{ id: 'msg-1', content: 'hello', role: Role.USER }];
      mockPrismaService.chatSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.getMessages('user-1', 'session-1');
      expect(result).toEqual(mockMessages);
      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('addMessage', () => {
    it('should add message and touch session updatedAt if owned by user', async () => {
      const mockSession = { id: 'session-1', userId: 'user-1' };
      const mockMessage = { id: 'msg-1', content: 'hello', role: Role.USER };
      mockPrismaService.chatSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockPrismaService.chatSession.update.mockResolvedValue(mockSession);

      const result = await service.addMessage('user-1', 'session-1', 'hello');
      expect(result).toEqual(mockMessage);
      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-1',
          role: Role.USER,
          content: 'hello',
        },
      });
      expect(mockPrismaService.chatSession.update).toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('should delete session if owned by user', async () => {
      const mockSession = { id: 'session-1', userId: 'user-1' };
      mockPrismaService.chatSession.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.chatSession.delete.mockResolvedValue(mockSession);

      const result = await service.deleteSession('user-1', 'session-1');
      expect(result).toEqual(mockSession);
    });
  });
});
