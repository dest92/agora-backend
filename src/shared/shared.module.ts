import { Module } from '@nestjs/common';
import { PgModule } from './database/pg.module';

@Module({
  imports: [PgModule],
  exports: [PgModule],
})
export class SharedModule {}
