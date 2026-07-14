import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Project name cannot be empty' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty({ message: 'Project path cannot be empty' })
  @IsOptional()
  path?: string;
}
