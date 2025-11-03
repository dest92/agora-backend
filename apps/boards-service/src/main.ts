import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { BoardsModule } from './boards.module';

/**
 * Microservices: TCP transport para comunicación interna
 * Cliente-Servidor: Gateway HTTP → Boards TCP
 */

async function bootstrap() {
  const port = parseInt(process.env.BOARDS_PORT || '3011');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BoardsModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: port,
      },
    },
  );

  await app.listen();
  console.log(`Boards Service (TCP) listening on port ${port}`);
}
bootstrap();
