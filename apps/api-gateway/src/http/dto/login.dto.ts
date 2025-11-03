import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO Pattern: Validación con class-validator
 * API Gateway: Validación de entrada HTTP para login
 */

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
