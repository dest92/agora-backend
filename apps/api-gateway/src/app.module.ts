import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PgModule } from '@app/lib-db';
import { EventsModule } from '@app/lib-events';
import { BoardsController } from './http/boards.controller';
import { HealthController } from './http/health.controller';
import { SocketGateway } from './socket/socket.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PgModule,
    EventsModule,
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
    ]),
  ],
  controllers: [BoardsController, HealthController],
  providers: [SocketGateway],
})
export class AppModule {}
