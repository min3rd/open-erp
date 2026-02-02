import { describe, it, expect } from 'vitest';
import {
  unwrap,
  isApiResponse,
  normalizeError,
  wrapSuccess,
  wrapError,
  ApiResponseError,
} from './http-wrapper';
import { ApiResponse, ApiError } from './interfaces';

describe('http-wrapper utilities', () => {
  describe('unwrap', () => {
    it('should return data from successful response', () => {
      const response: ApiResponse<{ id: string; name: string }> = {
        success: true,
        data: { id: '1', name: 'Test' },
      };

      const result = unwrap(response);
      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('should throw ApiResponseError when success is false', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };

      expect(() => unwrap(response)).toThrow(ApiResponseError);
      expect(() => unwrap(response)).toThrow('Resource not found');
    });

    it('should throw when data is null', () => {
      const response: ApiResponse<any> = {
        success: true,
        data: null,
      };

      expect(() => unwrap(response)).toThrow(ApiResponseError);
      expect(() => unwrap(response)).toThrow('contained no data');
    });

    it('should throw when data is undefined', () => {
      const response: ApiResponse<any> = {
        success: true,
        data: undefined,
      };

      expect(() => unwrap(response)).toThrow(ApiResponseError);
    });

    it('should throw with error details when available', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email', reason: 'invalid format' },
        },
      };

      try {
        unwrap(response);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiResponseError);
        const apiError = error as ApiResponseError;
        expect(apiError.code).toBe('VALIDATION_ERROR');
        expect(apiError.details).toEqual({ field: 'email', reason: 'invalid format' });
      }
    });

    it('should handle response without explicit error object', () => {
      const response: ApiResponse<never> = {
        success: false,
        message: 'Something went wrong',
      };

      expect(() => unwrap(response)).toThrow('Something went wrong');
    });
  });

  describe('isApiResponse', () => {
    it('should return true for valid API response', () => {
      const response = {
        success: true,
        data: { test: 'value' },
      };

      expect(isApiResponse(response)).toBe(true);
    });

    it('should return true for error response', () => {
      const response = {
        success: false,
        error: { code: 'ERROR', message: 'Error' },
      };

      expect(isApiResponse(response)).toBe(true);
    });

    it('should return false for non-object', () => {
      expect(isApiResponse(null)).toBe(false);
      expect(isApiResponse('string')).toBe(false);
      expect(isApiResponse(123)).toBe(false);
      expect(isApiResponse(undefined)).toBe(false);
    });

    it('should return false for object without success field', () => {
      const response = {
        data: { test: 'value' },
      };

      expect(isApiResponse(response)).toBe(false);
    });

    it('should return false when success is not boolean', () => {
      const response = {
        success: 'true',
        data: { test: 'value' },
      };

      expect(isApiResponse(response)).toBe(false);
    });
  });

  describe('normalizeError', () => {
    it('should return ApiError as-is', () => {
      const error: ApiError = {
        code: 'TEST_ERROR',
        message: 'Test message',
        details: { key: 'value' },
      };

      const result = normalizeError(error);
      expect(result).toEqual(error);
    });

    it('should convert string to ApiError', () => {
      const result = normalizeError('Error message');
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Error message');
      expect(result.timestamp).toBeDefined();
    });

    it('should convert Error object to ApiError', () => {
      const error = new Error('Test error');
      const result = normalizeError(error);
      expect(result.code).toBe('CLIENT_ERROR');
      expect(result.message).toBe('Test error');
      expect(result.timestamp).toBeDefined();
    });

    it('should handle unknown error types', () => {
      const result = normalizeError({ unknown: 'object' });
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.details).toEqual({ unknown: 'object' });
    });
  });

  describe('wrapSuccess', () => {
    it('should wrap data in successful response', () => {
      const data = { id: '1', name: 'Test' };
      const result = wrapSuccess(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
      expect(result.message).toBeNull();
    });

    it('should include optional message', () => {
      const data = { id: '1' };
      const result = wrapSuccess(data, 'Operation successful');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Operation successful');
    });

    it('should include optional metadata', () => {
      const data = { id: '1' };
      const meta = { timestamp: '2024-01-01', version: '1.0' };
      const result = wrapSuccess(data, undefined, meta);

      expect(result.success).toBe(true);
      expect(result.meta).toEqual(meta);
    });
  });

  describe('wrapError', () => {
    it('should wrap ApiError in failed response', () => {
      const error: ApiError = {
        code: 'TEST_ERROR',
        message: 'Test error',
      };
      const result = wrapError(error);

      expect(result.success).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.data).toBeNull();
    });

    it('should wrap string error', () => {
      const result = wrapError('Error message');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Error message');
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should include optional message override', () => {
      const error: ApiError = {
        code: 'ERROR',
        message: 'Original',
      };
      const result = wrapError(error, 'Override message');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Override message');
      expect(result.error).toEqual(error);
    });
  });

  describe('ApiResponseError', () => {
    it('should create error with all properties', () => {
      const error = new ApiResponseError('TEST_CODE', 'Test message', { key: 'value' }, '2024-01-01');

      expect(error.name).toBe('ApiResponseError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.timestamp).toBe('2024-01-01');
    });

    it('should create from ApiError', () => {
      const apiError: ApiError = {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: { resource: 'user' },
        timestamp: '2024-01-01',
      };

      const error = ApiResponseError.fromApiError(apiError);

      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.details).toEqual({ resource: 'user' });
      expect(error.timestamp).toBe('2024-01-01');
    });

    it('should be instanceof Error', () => {
      const error = new ApiResponseError('CODE', 'Message');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiResponseError).toBe(true);
    });
  });
});
