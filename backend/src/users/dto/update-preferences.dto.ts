import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePreferencesDto {
  @IsString()
  @IsOptional()
  theme?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  fontSize?: number;

  @IsString()
  @IsOptional()
  fontFamily?: string;

  @IsString()
  @IsOptional()
  aiProvider?: string;

  @IsString()
  @IsOptional()
  defaultLanguage?: string;

  @IsString()
  @IsOptional()
  openaiApiKey?: string;

  @IsString()
  @IsOptional()
  anthropicApiKey?: string;

  @IsString()
  @IsOptional()
  geminiApiKey?: string;

  @IsString()
  @IsOptional()
  ollamaUrl?: string;
}
