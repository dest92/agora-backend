import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './guards/auth.guard';
import { JwksService } from './services/jwks.service';
import { JwtVerifierService } from './services/jwt-verifier.service';

@Module({
  controllers: [AuthController],
  providers: [JwksService, JwtVerifierService, AuthGuard],
  exports: [AuthGuard, JwtVerifierService],
})
export class AuthModule {}
