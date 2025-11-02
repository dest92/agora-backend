import { ConfigModuleOptions } from '@nestjs/config';
import { envSchema } from './env.schema';

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.format();
    throw new Error(
      `Environment validation failed: ${JSON.stringify(errors, null, 2)}`,
    );
  }
  return result.data;
}

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  validate: validateEnv,
};
