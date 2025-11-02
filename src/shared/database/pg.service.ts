import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';
import { EnvConfig } from '../../config/env.schema';
import { SqlQuery } from './sql';

@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.configService.get('DATABASE_URL', { infer: true });
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    this.pool.on('error', (err) => {
      this.logger.error('Unexpected pg pool error', err);
    });
    await this.healthCheck();
    this.logger.log('PostgreSQL pool initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
    this.logger.log('PostgreSQL pool closed');
  }

  query<T = unknown>(
    queryTextOrObject: string | SqlQuery,
    values?: unknown[],
  ): Promise<QueryResult<T>> {
    if (typeof queryTextOrObject === 'string') {
      return this.pool.query<T>(queryTextOrObject, values);
    }
    return this.pool.query<T>(queryTextOrObject.text, queryTextOrObject.values);
  }

  getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  private async healthCheck(): Promise<void> {
    const result = await this.pool.query<{ ok: number }>('SELECT 1 as ok');
    if (result.rows[0]?.ok !== 1) {
      throw new Error('PostgreSQL health check failed');
    }
  }
}
