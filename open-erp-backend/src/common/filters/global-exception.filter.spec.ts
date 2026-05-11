import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import mongoose from 'mongoose';

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createHost = () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    const req: any = {
      requestId: 'req-1',
      method: 'GET',
      originalUrl: '/api/v1/users',
    };

    const res: any = { status, json };

    const host = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as ArgumentsHost;

    return { host, status, json, req };
  };

  it('keeps key/data contract when HttpException already provides message contract', () => {
    const exception = new HttpException(
      {
        code: 'VALIDATION_ERROR',
        message: {
          key: 'error.validation.email_format',
          data: { field: 'email' },
        },
      },
      HttpStatus.BAD_REQUEST,
    );

    const { host, status, json } = createHost();
    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toEqual({
      key: 'error.validation.email_format',
      data: { field: 'email' },
    });
  });

  it('maps string message into key/data contract', () => {
    const exception = new HttpException('Bad payload', HttpStatus.BAD_REQUEST);

    const { host, json } = createHost();
    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.message).toEqual({
      key: 'error.validation.invalid_input',
      data: { text: 'Bad payload' },
    });
  });

  it('returns INTERNAL_ERROR with key/data contract for unknown errors', () => {
    const { host, status, json } = createHost();
    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toEqual({
      key: 'error.internal.unexpected',
      data: {},
    });
  });

  it('should log error when status >= 500', () => {
    const logger = jest.spyOn(Logger.prototype, 'error');
    const exception = new Error('Internal server error');
    const { host } = createHost();

    filter.catch(exception, host);

    expect(logger).toHaveBeenCalled();
  });

  it('should not log for 4xx errors', () => {
    const logger = jest.spyOn(Logger.prototype, 'error');
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
    const { host } = createHost();

    filter.catch(exception, host);

    expect(logger).not.toHaveBeenCalled();
  });

  it('should handle Mongoose ValidationError', () => {
    const validationError = new mongoose.Error.ValidationError();
    const { host, status, json } = createHost();

    filter.catch(validationError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle Mongoose CastError', () => {
    const castError = new mongoose.Error.CastError(
      'ObjectId',
      'invalid-id',
      '_id',
    );
    const { host, status, json } = createHost();

    filter.catch(castError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should include requestId and timestamp in response', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    const { host, json } = createHost();

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.meta.requestId).toBe('req-1');
    expect(body.meta.timestamp).toBeDefined();
  });

  it('should set success to false', () => {
    const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
    const { host, json } = createHost();

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.success).toBe(false);
  });

  it('should include details in error response when provided', () => {
    const exception = new HttpException(
      {
        code: 'VALIDATION_ERROR',
        message: {
          key: 'error.validation',
          data: {},
        },
        details: { field: 'email', reason: 'invalid format' },
      },
      HttpStatus.BAD_REQUEST,
    );
    const { host, json } = createHost();

    filter.catch(exception, host);

    const body = json.mock.calls[0][0];
    expect(body.error.details).toEqual({
      field: 'email',
      reason: 'invalid format',
    });
  });
});
