import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'Project ID cannot be empty if provided' })
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsNotEmpty({ message: 'Session title cannot be empty if provided' })
  @IsOptional()
  title?: string;
}
