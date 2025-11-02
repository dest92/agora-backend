import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '../../auth/services/jwt-verifier.service';
import '../types/express.d.ts';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request: Request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
