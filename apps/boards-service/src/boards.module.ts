import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgModule } from '@app/lib-db';
import { EventsModule } from '@app/lib-events';
import { BoardsController } from './boards.controller';
import { BoardsCommandService } from './boards.command.service';
import { BoardsQueryService } from './boards.query.service';
import { BoardsDao } from './boards.dao';
import { BoardsManagementDao } from './boards-management.dao';
import { BoardsManagementCommandService } from './boards-management.command.service';
import { BoardsManagementQueryService } from './boards-management.query.service';
import { VotesDao } from './votes.dao';
import { VotesCommandService } from './votes.command.service';
import { VotesQueryService } from './votes.query.service';
import { AssigneesDao } from './assignees.dao';
import { AssigneesCommandService } from './assignees.command.service';
import { AssigneesQueryService } from './assignees.query.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PgModule, EventsModule],
  controllers: [BoardsController],
  providers: [
    BoardsCommandService,
    BoardsQueryService,
    BoardsDao,
    BoardsManagementDao,
    BoardsManagementCommandService,
    BoardsManagementQueryService,
    VotesDao,
    VotesCommandService,
    VotesQueryService,
    AssigneesDao,
    AssigneesCommandService,
    AssigneesQueryService,
  ],
})
export class BoardsModule {}
