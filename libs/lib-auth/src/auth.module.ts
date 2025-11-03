import { Module } from '@nestjs/common';
import { JwtVerifierService } from './jwt-verifier.service';
import { JwksService } from './jwks.service';
import { AuthGuard } from './guards/auth.guard';

/**
 * Singleton Pattern: Global auth module
 * Provides JWT verification services
 */

@Module({
  providers: [JwtVerifierService, JwksService, AuthGuard],
  exports: [JwtVerifierService, JwksService, AuthGuard],
})
export class AuthModule {}
