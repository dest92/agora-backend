import { IsString, IsOptional, IsHexColor, Length } from 'class-validator';

/**
 * DTO Pattern: Validación en Gateway
 * Contract: POST /boards/:boardId/tags
 */

export class CreateTagDto {
  @IsString()
  @Length(1, 50)
  label!: string;

  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;
}
