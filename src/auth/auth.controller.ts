import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthUser } from './services/jwt-verifier.service';

@Controller('auth')
export class AuthController {
  @Get('test')
  test(@CurrentUser() user: AuthUser) {
    return {
      message: 'Authentication successful',
      user: {
        userId: user.userId,
        email: user.email,
      },
    };
  }
}
