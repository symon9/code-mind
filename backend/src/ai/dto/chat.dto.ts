import { IsNotEmpty, IsArray, IsOptional, IsString, IsObject } from 'class-validator';
import { ChatMessage, AIOptions } from '../types';

export class ChatDto {
  @IsArray()
  @IsNotEmpty()
  messages: ChatMessage[];

  @IsString()
  @IsOptional()
  provider?: string;

  @IsObject()
  @IsOptional()
  options?: AIOptions;
}
