import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ChatService {
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
  }

  private async validateSessionOwnership(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat session');
    }

    return session;
  }

  async createSession(userId: string, dto: CreateSessionDto) {
    if (dto.projectId) {
      await this.validateProjectOwnership(userId, dto.projectId);
    }

    const title = dto.title || 'New Chat';

    return this.prisma.chatSession.create({
      data: {
        userId,
        projectId: dto.projectId || null,
        title,
      },
    });
  }

  async listSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(userId: string, sessionId: string) {
    await this.validateSessionOwnership(userId, sessionId);

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMessage(userId: string, sessionId: string, content: string) {
    await this.validateSessionOwnership(userId, sessionId);

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        sessionId,
        role: Role.USER, // enum Role.USER
        content,
      },
    });

    // Touch the session's updatedAt timestamp
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async deleteSession(userId: string, sessionId: string) {
    await this.validateSessionOwnership(userId, sessionId);

    return this.prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }
}
