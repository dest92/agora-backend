import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum CardPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export class CreateCardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsUUID()
  laneId?: string;

  @IsOptional()
  @IsEnum(CardPriority)
  priority?: CardPriority;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  position?: string;
}
