import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsNotEmpty({ message: 'File name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'File path is required' })
  path: string;

  @IsString()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: string;
}
