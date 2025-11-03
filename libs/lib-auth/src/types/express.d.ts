import { AuthUser } from '../jwt-verifier.service';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
