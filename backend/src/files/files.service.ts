import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateProjectOwnership(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async createFile(userId: string, dto: CreateFileDto) {
    // Validate project ownership
    await this.validateProjectOwnership(userId, dto.projectId);

    return this.prisma.fileItem.create({
      data: {
        name: dto.name,
        path: dto.path,
        projectId: dto.projectId,
      },
    });
  }

  async listFiles(userId: string, projectId: string) {
    // Validate project ownership
    await this.validateProjectOwnership(userId, projectId);

    return this.prisma.fileItem.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFile(userId: string, fileId: string) {
    const file = await this.prisma.fileItem.findUnique({
      where: { id: fileId },
      include: { project: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this file');
    }

    return this.prisma.fileItem.delete({
      where: { id: fileId },
    });
  }

  async getRecentFiles(userId: string) {
    return this.prisma.fileItem.findMany({
      where: {
        project: {
          userId: userId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  }
}
