import { IsString, MinLength } from 'class-validator';

/**
 * DTO Pattern: Validación con class-validator
 * API Gateway: Validación de entrada HTTP para refresh token
 */

export class RefreshDto {
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
