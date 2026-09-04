import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  async createSession(@Request() req: any, @Body() dto: CreateSessionDto) {
    const userId = req.user.sub;
    return this.chatService.createSession(userId, dto);
  }

  @Get('sessions')
  async listSessions(@Request() req: any) {
    const userId = req.user.sub;
    return this.chatService.listSessions(userId);
  }

  @Get('sessions/:id/messages')
  async getMessages(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.chatService.getMessages(userId, id);
  }

  @Post('sessions/:id/messages')
  async addMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    const userId = req.user.sub;
    return this.chatService.addMessage(userId, id, dto.content);
  }

  @Delete('sessions/:id')
  async deleteSession(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    await this.chatService.deleteSession(userId, id);
    return { message: 'Chat session deleted successfully' };
  }
}
