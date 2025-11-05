import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { CollabModule } from './collab.module';

/**
 * Microservices: TCP transport para comunicación interna
 * Cliente-Servidor: Gateway HTTP → Collab TCP
 */

async function bootstrap() {
  const port = parseInt(process.env.COLLAB_PORT || '3012');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CollabModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: port,
      },
    },
  );

  await app.listen();
  console.log(`Collab Service (TCP) listening on port ${port}`);
}
bootstrap();
