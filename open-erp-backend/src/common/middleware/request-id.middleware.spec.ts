import { Test, TestingModule } from '@nestjs/testing';
import { RequestIdMiddleware } from './request-id.middleware';
import { Request, Response, NextFunction } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();

    mockRequest = {
      header: jest.fn(),
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  it('should use existing x-request-id header if provided', () => {
    const providedId = 'custom-request-id-123';
    (mockRequest.header as jest.Mock).mockReturnValue(providedId);

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockRequest.requestId).toBe(providedId);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      providedId,
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should generate UUID when x-request-id header is not provided', () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockRequest.requestId).toBeDefined();
    // UUID should match the pattern
    expect(mockRequest.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      mockRequest.requestId,
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should trim whitespace from x-request-id header', () => {
    const providedId = '  custom-request-id-with-spaces  ';
    (mockRequest.header as jest.Mock).mockReturnValue(providedId);

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockRequest.requestId).toBe('custom-request-id-with-spaces');
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'custom-request-id-with-spaces',
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next() to continue the middleware chain', () => {
    (mockRequest.header as jest.Mock).mockReturnValue('test-id');

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should set header on response', () => {
    const providedId = 'test-id-456';
    (mockRequest.header as jest.Mock).mockReturnValue(providedId);

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction,
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      providedId,
    );
  });
});
