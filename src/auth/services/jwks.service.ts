import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'cross-fetch';
import { EnvConfig } from '../../config/env.schema';

interface JwksKey {
  kid: string;
  kty: string;
  use: string;
  n: string;
  e: string;
}

interface JwksResponse {
  keys: JwksKey[];
}

@Injectable()
export class JwksService {
  private readonly logger = new Logger(JwksService.name);
  private keysCache: Map<string, JwksKey> = new Map();
  private lastFetch = 0;
  private readonly cacheDurationMs = 5 * 60 * 1000;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  async getKey(kid: string): Promise<JwksKey | null> {
    const now = Date.now();
    if (
      now - this.lastFetch > this.cacheDurationMs ||
      !this.keysCache.has(kid)
    ) {
      await this.fetchKeys();
    }
    return this.keysCache.get(kid) || null;
  }

  private async fetchKeys(): Promise<void> {
    const jwksUrl = this.configService.get('SUPABASE_JWKS_URL', {
      infer: true,
    });
    const anonKey = this.configService.get('SUPABASE_ANON_KEY', {
      infer: true,
    });

    try {
      const response = await fetch(jwksUrl, {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
      });
      if (!response.ok) {
        throw new Error(`JWKS fetch failed: ${response.status}`);
      }
      const data = (await response.json()) as JwksResponse;
      this.keysCache.clear();
      for (const key of data.keys) {
        this.keysCache.set(key.kid, key);
      }
      this.lastFetch = Date.now();
      this.logger.log(`Fetched ${data.keys.length} JWKS keys`);
    } catch (error) {
      this.logger.error('Failed to fetch JWKS', error);
      throw error;
    }
  }
}
