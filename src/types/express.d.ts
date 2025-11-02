import { AuthUser } from '../auth/services/jwt-verifier.service';

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
