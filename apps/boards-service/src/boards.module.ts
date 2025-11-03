import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PgModule } from '@app/lib-db';
import { EventsModule } from '@app/lib-events';
import { BoardsController } from './boards.controller';
import { BoardsCommandService } from './boards.command.service';
import { BoardsQueryService } from './boards.query.service';
import { BoardsDao } from './boards.dao';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PgModule, EventsModule],
  controllers: [BoardsController],
  providers: [BoardsCommandService, BoardsQueryService, BoardsDao],
})
export class BoardsModule {}
