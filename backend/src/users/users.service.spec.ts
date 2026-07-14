import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    preference: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile if user exists', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserProfile('user-1');
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserProfile('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserProfile', () => {
    it('should update and return the user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Updated User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.updateUserProfile('user-1', 'Updated User');
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated User' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  describe('getUserPreferences', () => {
    it('should fetch and upsert preferences', async () => {
      const mockPrefs = {
        id: 'prefs-1',
        userId: 'user-1',
        theme: 'dark',
        fontSize: 14,
        fontFamily: 'Fira Code',
        aiProvider: 'gemini',
        defaultLanguage: 'typescript',
      };
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.preference.upsert.mockResolvedValue(mockPrefs);

      const result = await service.getUserPreferences('user-1');
      expect(result).toEqual(mockPrefs);
      expect(mockPrismaService.preference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: {
          userId: 'user-1',
          theme: 'dark',
          fontSize: 14,
          fontFamily: 'Fira Code',
          aiProvider: 'gemini',
          defaultLanguage: 'typescript',
        },
        update: {},
      });
    });
  });

  describe('updateUserPreferences', () => {
    it('should update and return preferences', async () => {
      const mockPrefs = {
        id: 'prefs-1',
        userId: 'user-1',
        theme: 'light',
        fontSize: 16,
        fontFamily: 'Fira Code',
        aiProvider: 'openai',
        defaultLanguage: 'javascript',
      };
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.preference.upsert.mockResolvedValue(mockPrefs);

      const updateDto = {
        theme: 'light',
        fontSize: 16,
        aiProvider: 'openai',
        defaultLanguage: 'javascript',
      };

      const result = await service.updateUserPreferences('user-1', updateDto);
      expect(result).toEqual(mockPrefs);
      expect(mockPrismaService.preference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: {
          userId: 'user-1',
          theme: 'light',
          fontSize: 16,
          fontFamily: 'Fira Code',
          aiProvider: 'openai',
          defaultLanguage: 'javascript',
        },
        update: updateDto,
      });
    });
  });
});
