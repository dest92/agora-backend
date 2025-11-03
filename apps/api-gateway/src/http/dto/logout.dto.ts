import { IsString, MinLength } from 'class-validator';

/**
 * DTO Pattern: Validación con class-validator
 * API Gateway: Validación de entrada HTTP para logout
 */

export class LogoutDto {
  @IsString()
  @MinLength(10)
  accessToken!: string;
}
