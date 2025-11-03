import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class PgService implements OnModuleInit {
  private pool!: Pool;

  onModuleInit(): void {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
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
}
