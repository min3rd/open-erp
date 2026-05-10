import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = req.header('x-request-id')?.trim() || randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    next();
  }
}
