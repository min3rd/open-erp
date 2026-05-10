import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { status, payload } = this.normalizeException(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `requestId=${req.requestId} ${req.method} ${req.originalUrl}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    }

    res.status(status).json({
      success: false,
      error: payload,
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private normalizeException(exception: unknown): {
    status: number;
    payload: { code: string; message: string; details?: unknown };
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          payload: {
            code: this.defaultCode(status),
            message: response,
          },
        };
      }

      const responseObj = response as Record<string, unknown>;
      return {
        status,
        payload: {
          code:
            typeof responseObj.code === 'string'
              ? responseObj.code
              : this.defaultCode(status),
          message:
            typeof responseObj.message === 'string'
              ? responseObj.message
              : exception.message,
          details: responseObj,
        },
      };
    }

    if (
      exception instanceof mongoose.Error.ValidationError ||
      exception instanceof mongoose.Error.CastError
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        payload: {
          code: 'VALIDATION_ERROR',
          message: exception.message,
        },
      };
    }

    if (exception instanceof MongoServerError && exception.code === 11000) {
      return {
        status: HttpStatus.CONFLICT,
        payload: {
          code: 'CONFLICT',
          message: 'Duplicate key error',
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    };
  }

  private defaultCode(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
    if (status === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.CONFLICT) return 'CONFLICT';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMIT_EXCEEDED';

    return 'INTERNAL_ERROR';
  }
}
