import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgModule } from '@app/lib-db';
import { EventsModule } from '@app/lib-events';
import { SessionsController } from './sessions.controller';
import { SessionsCommandService } from './sessions.command.service';
import { SessionsQueryService } from './sessions.query.service';
import { WorkspacesDao } from './workspaces/workspaces.dao';
import { SessionsDao } from './sessions/sessions.dao';

/**
 * Microservices Module: Sessions domain
 * Singleton: @Global modules (PgModule, EventsModule)
 * EDA: EventsModule para domain events
 */

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PgModule,
    EventsModule,
  ],
  controllers: [SessionsController],
  providers: [
    SessionsCommandService,
    SessionsQueryService,
    WorkspacesDao,
    SessionsDao,
  ],
})
export class SessionsModule {}
