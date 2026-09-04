import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    const userId = req.user.sub;
    return this.usersService.getUserProfile(userId);
  }

  @Patch('me')
  async updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
    const userId = req.user.sub;
    return this.usersService.updateUserProfile(userId, dto.name);
  }

  @Get('me/preferences')
  async getPreferences(@Request() req: any) {
    const userId = req.user.sub;
    return this.usersService.getUserPreferences(userId);
  }

  @Patch('me/preferences')
  async updatePreferences(
    @Request() req: any,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const userId = req.user.sub;
    return this.usersService.updateUserPreferences(userId, dto);
  }
}
