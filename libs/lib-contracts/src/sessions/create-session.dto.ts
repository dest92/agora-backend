import { IsString, Length } from 'class-validator';

/**
 * DTO Pattern: Validación con class-validator
 * API Gateway: Validación de entrada HTTP
 */

export class CreateSessionDto {
  @IsString()
  @Length(1, 200)
  title!: string;
}
