import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a project', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        path: '/test',
        userId: 'user-1',
      };
      mockPrismaService.project.create.mockResolvedValue(mockProject);

      const result = await service.createProject('user-1', {
        name: 'Test Project',
        path: '/test',
      });
      expect(result).toEqual(mockProject);
      expect(mockPrismaService.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Project',
          path: '/test',
          userId: 'user-1',
        },
      });
    });
  });

  describe('listProjects', () => {
    it('should list user projects', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'P1', path: '/p1', userId: 'user-1' },
      ];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.listProjects('user-1');
      expect(result).toEqual(mockProjects);
      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getProject', () => {
    it('should return project if owned by user', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'P1',
        path: '/p1',
        userId: 'user-1',
      };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.getProject('user-1', 'project-1');
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getProject('user-1', 'project-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if project owned by another user', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'P1',
        path: '/p1',
        userId: 'user-2',
      };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      await expect(service.getProject('user-1', 'project-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateProject', () => {
    it('should update project if owned by user', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'P1',
        path: '/p1',
        userId: 'user-1',
      };
      const updatedProject = { ...mockProject, name: 'P1-updated' };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.project.update.mockResolvedValue(updatedProject);

      const result = await service.updateProject('user-1', 'project-1', {
        name: 'P1-updated',
      });
      expect(result).toEqual(updatedProject);
      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: { name: 'P1-updated' },
      });
    });
  });

  describe('deleteProject', () => {
    it('should delete project if owned by user', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'P1',
        path: '/p1',
        userId: 'user-1',
      };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.project.delete.mockResolvedValue(mockProject);

      const result = await service.deleteProject('user-1', 'project-1');
      expect(result).toEqual(mockProject);
      expect(mockPrismaService.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
    });
  });
});
