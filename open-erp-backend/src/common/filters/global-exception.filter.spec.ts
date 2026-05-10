import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

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

    return { host, status, json };
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
});
