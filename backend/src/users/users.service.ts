import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { encryptText, decryptText, maskApiKey } from '../common/crypto.util';

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

  private sanitizePreferences(pref: any) {
    if (!pref) return pref;
    const res = { ...pref };
    if ('openaiApiKey' in pref) {
      res.openaiApiKey = pref.openaiApiKey
        ? maskApiKey(decryptText(pref.openaiApiKey))
        : '';
    }
    if ('anthropicApiKey' in pref) {
      res.anthropicApiKey = pref.anthropicApiKey
        ? maskApiKey(decryptText(pref.anthropicApiKey))
        : '';
    }
    if ('geminiApiKey' in pref) {
      res.geminiApiKey = pref.geminiApiKey
        ? maskApiKey(decryptText(pref.geminiApiKey))
        : '';
    }
    return res;
  }

  async getUserPreferences(userId: string) {
    await this.getUserProfile(userId);

    const pref = await this.prisma.preference.upsert({
      where: { userId },
      create: {
        userId,
        theme: 'dark',
        fontSize: 14,
        fontFamily: 'Fira Code',
        aiProvider: 'gemini',
        defaultLanguage: 'typescript',
      },
      update: {},
    });

    return this.sanitizePreferences(pref);
  }

  async updateUserPreferences(userId: string, dto: UpdatePreferencesDto) {
    await this.getUserProfile(userId);

    const updateData: any = { ...dto };

    // Encrypt any submitted API keys before storing
    if (dto.openaiApiKey !== undefined) {
      updateData.openaiApiKey = dto.openaiApiKey ? encryptText(dto.openaiApiKey) : null;
    }
    if (dto.anthropicApiKey !== undefined) {
      updateData.anthropicApiKey = dto.anthropicApiKey ? encryptText(dto.anthropicApiKey) : null;
    }
    if (dto.geminiApiKey !== undefined) {
      updateData.geminiApiKey = dto.geminiApiKey ? encryptText(dto.geminiApiKey) : null;
    }

    const defaults = {
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'Fira Code',
      aiProvider: 'gemini',
      defaultLanguage: 'typescript',
    };

    const createData: any = {
      userId,
      theme: dto.theme ?? defaults.theme,
      fontSize: dto.fontSize ?? defaults.fontSize,
      fontFamily: dto.fontFamily ?? defaults.fontFamily,
      aiProvider: dto.aiProvider ?? defaults.aiProvider,
      defaultLanguage: dto.defaultLanguage ?? defaults.defaultLanguage,
    };

    if (updateData.openaiApiKey !== undefined) createData.openaiApiKey = updateData.openaiApiKey;
    if (updateData.anthropicApiKey !== undefined) createData.anthropicApiKey = updateData.anthropicApiKey;
    if (updateData.geminiApiKey !== undefined) createData.geminiApiKey = updateData.geminiApiKey;
    if (dto.ollamaUrl !== undefined) createData.ollamaUrl = dto.ollamaUrl;

    const pref = await this.prisma.preference.upsert({
      where: { userId },
      create: createData,
      update: updateData,
    });

    return this.sanitizePreferences(pref);
  }
}
