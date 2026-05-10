import { HttpException, HttpStatus } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RateLimitMiddleware } from './rate-limit.middleware';

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;

  beforeEach(() => {
    middleware = new RateLimitMiddleware();
  });

  const createResponse = (): Response => {
    return {
      setHeader: jest.fn(),
    } as unknown as Response;
  };

  it('allows request under limit and calls next', () => {
    const req = {
      path: '/api/v1/users',
      ip: '127.0.0.1',
      headers: {},
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as unknown as NextFunction;

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((res.setHeader as jest.Mock).mock.calls.length).toBeGreaterThan(0);
  });

  it('throws 429 with key/data contract when auth limit is exceeded', () => {
    const req = {
      path: '/api/v1/auth/login',
      ip: '127.0.0.2',
      headers: {},
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as unknown as NextFunction;

    for (let i = 0; i < 10; i += 1) {
      middleware.use(req, res, next);
    }

    let thrown: HttpException | undefined;
    try {
      middleware.use(req, res, next);
    } catch (error) {
      thrown = error as HttpException;
    }

    expect(thrown).toBeInstanceOf(HttpException);
    expect(thrown?.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(thrown?.getResponse()).toEqual({
      code: 'RATE_LIMIT_EXCEEDED',
      message: {
        key: 'error.rate_limit.exceeded',
        data: expect.objectContaining({
          limit: 10,
          windowMs: 60000,
        }),
      },
    });
    expect(res.setHeader).toHaveBeenCalledWith('retry-after', expect.any(String));
  });
});
