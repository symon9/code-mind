import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFileDto } from './dto/create-file.dto';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateFileDto) {
    const userId = req.user.sub;
    return this.filesService.createFile(userId, dto);
  }

  @Get('recent')
  async getRecent(@Request() req: any) {
    const userId = req.user.sub;
    return this.filesService.getRecentFiles(userId);
  }

  @Get()
  async list(@Request() req: any, @Query('projectId') projectId?: string) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required');
    }
    const userId = req.user.sub;
    return this.filesService.listFiles(userId, projectId);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    await this.filesService.deleteFile(userId, id);
    return { message: 'File record deleted successfully' };
  }
}
