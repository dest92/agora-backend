import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsObject,
} from 'class-validator';

/**
 * DTO Pattern: Validación con class-validator
 * API Gateway: Validación de entrada HTTP para registro
 */

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    name?: string;
    emoji?: string;
    color?: string;
  };
}
