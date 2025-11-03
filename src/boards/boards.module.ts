import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { SharedModule } from '../shared/shared.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [SharedModule, RealtimeModule],
  controllers: [BoardsController, CommentsController, VotesController],
  providers: [BoardsService, CommentsService, VotesService],
})
export class BoardsModule {}
