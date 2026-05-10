import type { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface User extends JwtPayload {
      sub?: string;
      tenantId?: string;
      roles?: string[];
    }

    interface Request {
      requestId?: string;
      tenantId?: string;
      user?: User;
    }
  }
}

export {};
