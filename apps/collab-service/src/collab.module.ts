import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgModule } from '@app/lib-db';
import { EventsModule } from '@app/lib-events';
import { CollabController } from './collab.controller';
import { CollabQueryService } from './collab.query.service';
import { CollabCommandService } from './collab.command.service';
import { TagsDao } from './tags/tags.dao';
import { AssigneesDao } from './assignees/assignees.dao';

/**
 * Microservices Module: Collab domain
 * Singleton: @Global modules (PgModule, EventsModule)
 */

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PgModule,
    EventsModule,
  ],
  controllers: [CollabController],
  providers: [
    CollabQueryService,
    CollabCommandService,
    TagsDao,
    AssigneesDao,
  ],
})
export class CollabModule {}
