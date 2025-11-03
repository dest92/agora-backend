import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import type { CardPriority } from '../types/card.types';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsUUID()
  laneId?: string;

  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: CardPriority;

  @IsOptional()
  @IsNumber()
  position?: number;
}
