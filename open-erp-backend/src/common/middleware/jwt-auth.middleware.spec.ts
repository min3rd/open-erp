import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthMiddleware } from './jwt-auth.middleware';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('jsonwebtoken');

describe('JwtAuthMiddleware', () => {
  let middleware: JwtAuthMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new JwtAuthMiddleware();

    mockRequest = {
      header: jest.fn(),
      path: '/api/v1/users',
      user: undefined,
    };

    mockResponse = {};
    mockNext = jest.fn();

    delete process.env.JWT_PUBLIC_KEY;
    delete process.env.JWT_SECRET;
    delete process.env.REDIS_URL;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('public paths', () => {
    it('should allow /health without token', async () => {
      mockRequest.path = '/health';
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow /api/docs without token', async () => {
      mockRequest.path = '/api/docs/swagger';
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow /api/v1/auth without token', async () => {
      mockRequest.path = '/api/v1/auth/login';
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('token validation', () => {
    it('should throw when token missing', async () => {
      mockRequest.path = '/api/v1/users';
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);
      await expect(
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          mockNext,
        ),
      ).rejects.toThrow();
    });

    it('should verify HS256 token', async () => {
      process.env.JWT_SECRET = 'secret';
      (mockRequest.header as jest.Mock).mockReturnValue('Bearer token123');
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      expect(jwt.verify).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
