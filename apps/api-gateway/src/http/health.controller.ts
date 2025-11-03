import { Controller, Get } from '@nestjs/common';
import { Public } from '@app/lib-auth';

@Controller()
export class HealthController {
  @Get('health')
  @Public()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: '1.0.0',
    };
  }
}
