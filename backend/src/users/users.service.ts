import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserProfile(userId: string, name: string) {
    // Check if user exists first to throw correct exception
    await this.getUserProfile(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserPreferences(userId: string) {
    // Check if user exists
    await this.getUserProfile(userId);

    return this.prisma.preference.upsert({
      where: { userId },
      create: {
        userId,
        theme: 'dark',
        fontSize: 14,
        fontFamily: 'Fira Code',
        aiProvider: 'gemini',
        defaultLanguage: 'typescript',
      },
      update: {}, // No changes if already exists
    });
  }

  async updateUserPreferences(userId: string, dto: UpdatePreferencesDto) {
    // Check if user exists
    await this.getUserProfile(userId);

    const defaults = {
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'Fira Code',
      aiProvider: 'gemini',
      defaultLanguage: 'typescript',
    };

    return this.prisma.preference.upsert({
      where: { userId },
      create: {
        userId,
        theme: dto.theme ?? defaults.theme,
        fontSize: dto.fontSize ?? defaults.fontSize,
        fontFamily: dto.fontFamily ?? defaults.fontFamily,
        aiProvider: dto.aiProvider ?? defaults.aiProvider,
        defaultLanguage: dto.defaultLanguage ?? defaults.defaultLanguage,
      },
      update: dto,
    });
  }
}
