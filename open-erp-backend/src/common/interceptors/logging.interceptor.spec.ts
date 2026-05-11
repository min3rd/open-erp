import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Request, Response } from 'express';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
    };

    interceptor = new LoggingInterceptor();
    (interceptor as any).logger = mockLogger;
  });

  describe('intercept', () => {
    it('should log request/response information on success', (done) => {
      const mockRequest: Partial<Request> = {
        requestId: 'req-123',
        method: 'GET',
        originalUrl: '/api/users',
        tenantId: 'tenant-456',
        user: { sub: 'user-789' },
      };

      const mockResponse: Partial<Response> = {
        statusCode: 200,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({}),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('req-123'),
          );
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('GET'),
          );
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('/api/users'),
          );
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('tenant-456'),
          );
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('user-789'),
          );
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('200'),
          );
          done();
        },
      });
    });

    it('should log request/response even on error', (done) => {
      const mockRequest: Partial<Request> = {
        requestId: 'req-456',
        method: 'POST',
        originalUrl: '/api/data',
        tenantId: 'tenant-789',
        user: { sub: 'user-123' },
      };

      const mockResponse: Partial<Response> = {
        statusCode: 500,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: () => throwError(() => new Error('Test error')),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('req-456'),
          );
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('POST'),
          );
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('500'),
          );
          done();
        },
      });
    });

    it('should include duration in logged data', (done) => {
      const mockRequest: Partial<Request> = {
        requestId: 'req-duration',
        method: 'GET',
        originalUrl: '/api/test',
        tenantId: 'tenant-test',
      };

      const mockResponse: Partial<Response> = {
        statusCode: 200,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({}),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          const loggedData = mockLogger.log.mock.calls[0][0];
          const parsedData = JSON.parse(loggedData);

          expect(parsedData).toHaveProperty('duration');
          expect(typeof parsedData.duration).toBe('number');
          expect(parsedData.duration).toBeGreaterThanOrEqual(0);
          done();
        },
      });
    });

    it('should include timestamp in logged data', (done) => {
      const mockRequest: Partial<Request> = {
        requestId: 'req-timestamp',
        method: 'GET',
        originalUrl: '/api/test',
      };

      const mockResponse: Partial<Response> = {
        statusCode: 200,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({}),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          const loggedData = mockLogger.log.mock.calls[0][0];
          const parsedData = JSON.parse(loggedData);

          expect(parsedData).toHaveProperty('timestamp');
          expect(typeof parsedData.timestamp).toBe('string');
          done();
        },
      });
    });

    it('should handle requests without user information', (done) => {
      const mockRequest: Partial<Request> = {
        requestId: 'req-no-user',
        method: 'GET',
        originalUrl: '/api/public',
        tenantId: 'tenant-public',
        // No user property
      };

      const mockResponse: Partial<Response> = {
        statusCode: 200,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({}),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          const loggedData = mockLogger.log.mock.calls[0][0];
          const parsedData = JSON.parse(loggedData);

          expect(parsedData.userId).toBeUndefined();
          done();
        },
      });
    });

    it('should handle requests without tenantId', (done) => {
      const mockRequest: Partial<Request> = {
        requestId: 'req-no-tenant',
        method: 'GET',
        originalUrl: '/health',
      };

      const mockResponse: Partial<Response> = {
        statusCode: 200,
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({}),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          const loggedData = mockLogger.log.mock.calls[0][0];
          const parsedData = JSON.parse(loggedData);

          expect(parsedData.tenantId).toBeUndefined();
          done();
        },
      });
    });
  });
});
