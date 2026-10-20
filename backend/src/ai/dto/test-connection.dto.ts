import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TestConnectionDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  ollamaUrl?: string;

  @IsString()
  @IsOptional()
  model?: string;
}
