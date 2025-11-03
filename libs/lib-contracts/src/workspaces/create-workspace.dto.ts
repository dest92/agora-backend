import { IsString, Length } from 'class-validator';

/**
 * DTO Pattern: Validación con class-validator
 * API Gateway: Validación de entrada HTTP
 */

export class CreateWorkspaceDto {
  @IsString()
  @Length(1, 100)
  name!: string;
}
