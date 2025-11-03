import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgModule } from '@app/lib-db';
import { EventsModule } from '@app/lib-events';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PgModule, EventsModule],
  controllers: [],
  providers: [],
})
export class CollabModule {}
