import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnvConfig } from '../config/env.schema';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const url = this.configService.get('SUPABASE_URL', { infer: true });
    const serviceKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY', {
      infer: true,
    });
    this.supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    }) as SupabaseClient;
  }

  async publish(
    channelName: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    try {
      const channel = this.supabase.channel(channelName);
      channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
      await channel.unsubscribe();
      this.logger.debug(`Published ${event} to ${channelName}`);
    } catch (error) {
      this.logger.error(`Failed to publish to ${channelName}`, error);
      throw error;
    }
  }
}
