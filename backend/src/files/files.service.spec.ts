import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    project: {
      findUnique: jest.fn(),
    },
    fileItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFile', () => {
    it('should create file if project is owned by user', async () => {
      const mockProject = { id: 'project-1', userId: 'user-1' };
      const mockFile = { id: 'file-1', name: 'App.tsx', path: '/src/App.tsx', projectId: 'project-1' };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.fileItem.create.mockResolvedValue(mockFile);

      const result = await service.createFile('user-1', {
        name: 'App.tsx',
        path: '/src/App.tsx',
        projectId: 'project-1',
      });

      expect(result).toEqual(mockFile);
      expect(mockPrismaService.fileItem.create).toHaveBeenCalledWith({
        data: {
          name: 'App.tsx',
          path: '/src/App.tsx',
          projectId: 'project-1',
        },
      });
    });

    it('should throw ForbiddenException if project is owned by another user', async () => {
      const mockProject = { id: 'project-1', userId: 'user-2' };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      await expect(
        service.createFile('user-1', {
          name: 'App.tsx',
          path: '/src/App.tsx',
          projectId: 'project-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listFiles', () => {
    it('should return files of project', async () => {
      const mockProject = { id: 'project-1', userId: 'user-1' };
      const mockFiles = [{ id: 'file-1', name: 'App.tsx', path: '/src/App.tsx', projectId: 'project-1' }];
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.fileItem.findMany.mockResolvedValue(mockFiles);

      const result = await service.listFiles('user-1', 'project-1');
      expect(result).toEqual(mockFiles);
      expect(mockPrismaService.fileItem.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('deleteFile', () => {
    it('should delete file if owner matches', async () => {
      const mockFile = {
        id: 'file-1',
        name: 'App.tsx',
        projectId: 'project-1',
        project: { id: 'project-1', userId: 'user-1' },
      };
      mockPrismaService.fileItem.findUnique.mockResolvedValue(mockFile);
      mockPrismaService.fileItem.delete.mockResolvedValue(mockFile);

      const result = await service.deleteFile('user-1', 'file-1');
      expect(result).toEqual(mockFile);
    });

    it('should throw ForbiddenException if owned by another user', async () => {
      const mockFile = {
        id: 'file-1',
        name: 'App.tsx',
        projectId: 'project-1',
        project: { id: 'project-1', userId: 'user-2' },
      };
      mockPrismaService.fileItem.findUnique.mockResolvedValue(mockFile);

      await expect(service.deleteFile('user-1', 'file-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getRecentFiles', () => {
    it('should return 10 recent files of user projects', async () => {
      const mockFiles = [{ id: 'file-1', name: 'App.tsx' }];
      mockPrismaService.fileItem.findMany.mockResolvedValue(mockFiles);

      const result = await service.getRecentFiles('user-1');
      expect(result).toEqual(mockFiles);
      expect(mockPrismaService.fileItem.findMany).toHaveBeenCalledWith({
        where: {
          project: {
            userId: 'user-1',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });
    });
  });
});
