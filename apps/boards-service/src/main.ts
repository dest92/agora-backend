import { NestFactory } from '@nestjs/core';
import { BoardsModule } from './boards.module';

async function bootstrap() {
  const app = await NestFactory.create(BoardsModule);
  
  const port = process.env.BOARDS_PORT || 3011;
  await app.listen(port);
  console.log(`Boards Service listening on port ${port}`);
}
bootstrap();
