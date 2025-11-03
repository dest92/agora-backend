import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_GUARD } from '@nestjs/core';
import { PgModule } from '@app/lib-db';
import { EventsModule } from '@app/lib-events';
import { AuthModule, AuthGuard } from '@app/lib-auth';
import { BoardsController } from './http/boards.controller';
import { HealthController } from './http/health.controller';
import { TagsController } from './http/tags.controller';
import { AssigneesController } from './http/assignees.controller';
import { WorkspacesController } from './http/workspaces.controller';
import { SessionsController } from './http/sessions.controller';
import { AuthController } from './http/auth.controller';
import { ServicesHealthController } from './http/services-health.controller';
import { SocketGateway } from './socket/socket.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    PgModule,
    EventsModule,
    AuthModule,
    ClientsModule.register([
      {
        name: 'BOARDS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: parseInt(process.env.BOARDS_PORT || '3011'),
        },
      },
      {
        name: 'COLLAB_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: parseInt(process.env.COLLAB_PORT || '3012'),
        },
      },
      {
        name: 'SESSIONS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: parseInt(process.env.SESSIONS_PORT || '3013'),
        },
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: parseInt(process.env.NOTIFICATIONS_PORT || '3014'),
        },
      },
    ]),
  ],
  controllers: [
    BoardsController,
    HealthController,
    TagsController,
    AssigneesController,
    WorkspacesController,
    SessionsController,
    AuthController,
    ServicesHealthController,
  ],
  providers: [
    SocketGateway,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
