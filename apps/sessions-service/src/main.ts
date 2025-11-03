import { NestFactory } from '@nestjs/core';
import { SessionsModule } from './sessions.module';

async function bootstrap() {
  const app = await NestFactory.create(SessionsModule);
  
  const port = process.env.SESSIONS_PORT || 3013;
  await app.listen(port);
  console.log(`Sessions Service listening on port ${port}`);
}
bootstrap();
