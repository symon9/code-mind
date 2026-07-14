import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateProjectDto) {
    const userId = req.user.sub;
    return this.projectsService.createProject(userId, dto);
  }

  @Get()
  async list(@Request() req: any) {
    const userId = req.user.sub;
    return this.projectsService.listProjects(userId);
  }

  @Get(':id')
  async get(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.projectsService.getProject(userId, id);
  }

  @Patch(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    const userId = req.user.sub;
    return this.projectsService.updateProject(userId, id, dto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    await this.projectsService.deleteProject(userId, id);
    return { message: 'Project deleted successfully' };
  }
}
