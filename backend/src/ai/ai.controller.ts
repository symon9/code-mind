import { Controller, Post, Body, Sse, Request, UseGuards, HttpCode, HttpStatus, MessageEvent } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatDto } from './dto/chat.dto';
import { ActionDto } from './dto/action.dto';
import { Observable } from 'rxjs';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Request() req: any, @Body() dto: ChatDto) {
    const userId = req.user.sub;
    return this.aiService.chat(userId, dto.messages, dto.options || {}, dto.provider);
  }

  @Post('stream')
  @HttpCode(HttpStatus.OK)
  @Sse()
  stream(
    @Request() req: any,
    @Body() dto: ChatDto,
  ): Observable<MessageEvent> {
    const userId = req.user.sub;
    const asyncIterable = this.aiService.stream(userId, dto.messages, dto.options || {}, dto.provider);

    return new Observable<MessageEvent>((subscriber) => {
      let active = true;
      (async () => {
        try {
          for await (const val of asyncIterable) {
            if (!active) break;
            
            if (val.metadata) {
              subscriber.next({
                data: { metadata: val.metadata },
                type: 'metadata',
              });
            } else {
              subscriber.next({
                data: { chunk: val.chunk },
              });
            }
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();

      return () => {
        active = false;
      };
    });
  }

  @Post('actions')
  @HttpCode(HttpStatus.OK)
  async actions(@Request() req: any, @Body() dto: ActionDto) {
    const userId = req.user.sub;
    return this.aiService.executeAction(
      userId,
      dto.action,
      dto.code,
      dto.language,
      dto.context,
      dto.provider,
    );
  }
}
