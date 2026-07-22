import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ActionDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsString()
  @IsOptional()
  provider?: string;
}
