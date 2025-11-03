import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';

/**
 * Singleton Pattern: @Global PgModule compartido
 * DAO Pattern: Pool de conexiones PostgreSQL
 */

@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgService.name);
  private pool!: Pool;

  onModuleInit(): void {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.logger.log('PostgreSQL pool initialized');
  }

  async query<T>(query: {
    text: string;
    values: unknown[];
  }): Promise<QueryResult<T>> {
    return this.pool.query<T>(query);
  }

  getPool(): Pool {
    return this.pool;
  }

  /**
   * Graceful Shutdown: Cerrar pool PostgreSQL
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing PostgreSQL pool...');
    
    try {
      await this.pool.end();
      this.logger.log('PostgreSQL pool closed successfully');
    } catch (error) {
      this.logger.error('Error closing PostgreSQL pool:', error);
    }
  }
}
