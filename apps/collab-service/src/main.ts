import { NestFactory } from '@nestjs/core';
import { CollabModule } from './collab.module';

async function bootstrap() {
  const app = await NestFactory.create(CollabModule);
  
  const port = process.env.COLLAB_PORT || 3012;
  await app.listen(port);
  console.log(`Collab Service listening on port ${port}`);
}
bootstrap();
