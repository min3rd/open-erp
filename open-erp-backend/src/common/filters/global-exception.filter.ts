import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';

type MessageContract = {
  key: string;
  data: Record<string, unknown>;
};

type ErrorPayload = {
  code: string;
  message: MessageContract;
  details?: unknown;
};

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
    payload: ErrorPayload;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          payload: {
            code: this.defaultCode(status),
            message: {
              key: this.defaultMessageKey(status),
              data: { text: response },
            },
          },
        };
      }

      const responseObj = this.toRecord(response);
      const normalizedMessage = this.normalizeMessage(responseObj.message, status);

      return {
        status,
        payload: {
          code:
            typeof responseObj.code === 'string'
              ? responseObj.code
              : this.defaultCode(status),
          message: normalizedMessage,
          details: responseObj.details,
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
          message: {
            key: 'error.validation.invalid_input',
            data: { reason: exception.message },
          },
        },
      };
    }

    if (exception instanceof MongoServerError && exception.code === 11000) {
      return {
        status: HttpStatus.CONFLICT,
        payload: {
          code: 'CONFLICT',
          message: {
            key: 'error.conflict.duplicate',
            data: {
              keyPattern: exception.keyPattern,
              keyValue: exception.keyValue,
            },
          },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: 'INTERNAL_ERROR',
        message: {
          key: this.defaultMessageKey(HttpStatus.INTERNAL_SERVER_ERROR),
          data: {},
        },
      },
    };
  }

  private normalizeMessage(rawMessage: unknown, status: number): MessageContract {
    if (typeof rawMessage === 'string') {
      return {
        key: this.defaultMessageKey(status),
        data: { text: rawMessage },
      };
    }

    const asRecord = this.toRecord(rawMessage);
    if (typeof asRecord.key === 'string') {
      return {
        key: asRecord.key,
        data: this.toRecord(asRecord.data),
      };
    }

    return {
      key: this.defaultMessageKey(status),
      data: {},
    };
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
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

  private defaultMessageKey(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return 'error.validation.invalid_input';
    if (status === HttpStatus.UNAUTHORIZED) return 'error.auth.unauthorized';
    if (status === HttpStatus.FORBIDDEN) return 'error.auth.forbidden';
    if (status === HttpStatus.NOT_FOUND) return 'error.resource.not_found';
    if (status === HttpStatus.CONFLICT) return 'error.conflict.duplicate';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'error.rate_limit.exceeded';

    return 'error.internal.unexpected';
  }
}
