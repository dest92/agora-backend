import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import { JwksService } from './jwks.service';

export interface JwtPayload {
  sub: string;
  email?: string;
  iss: string;
  aud: string;
  exp: number;
  nbf?: number;
}

export interface AuthUser {
  userId: string;
  email: string;
}

@Injectable()
export class JwtVerifierService {
  private readonly logger = new Logger(JwtVerifierService.name);
  private readonly expectedIssuer: string;
  private readonly expectedAudience = 'authenticated';

  constructor(
    private readonly jwksService: JwksService,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get('SUPABASE_URL', {
      infer: true,
    });
    this.expectedIssuer = `${supabaseUrl}/auth/v1`;
  }

  async verify(token: string): Promise<AuthUser> {
    try {
      // Try direct verification with JWT secret first (for development)
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      
      if (jwtSecret && jwtSecret !== 'your-jwt-secret-here') {
        try {
          const verified = jwt.verify(token, jwtSecret, {
            algorithms: ['HS256'],
            issuer: this.expectedIssuer,
            audience: this.expectedAudience,
          }) as JwtPayload;
          
          return {
            userId: verified.sub,
            email: verified.email || '',
          };
        } catch (secretError) {
          this.logger.warn('JWT secret verification failed, trying JWKS...', secretError);
        }
      }

      // Fallback to JWKS verification
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid token format');
      }
      const { header } = decoded;
      if (!header.kid) {
        throw new UnauthorizedException('Missing kid in token header');
      }
      const jwk = await this.jwksService.getKey(header.kid);
      if (!jwk) {
        throw new UnauthorizedException('Unknown signing key');
      }
      const verifiedJwk = jwk;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const pem = jwkToPem(verifiedJwk as any);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const verified = jwt.verify(token, pem as any, {
        algorithms: ['RS256'],
        issuer: this.expectedIssuer,
        audience: this.expectedAudience,
      }) as JwtPayload;
      return {
        userId: verified.sub,
        email: verified.email || '',
      };
    } catch (error) {
      this.logger.warn('JWT verification failed', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
