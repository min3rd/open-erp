import { ApiResponse, ApiError } from './interfaces';

/**
 * Custom error class for API errors
 */
export class ApiResponseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>,
    public readonly timestamp?: string
  ) {
    super(message);
    this.name = 'ApiResponseError';
    Object.setPrototypeOf(this, ApiResponseError.prototype);
  }

  static fromApiError(error: ApiError): ApiResponseError {
    return new ApiResponseError(error.code, error.message, error.details, error.timestamp);
  }
}

/**
 * Unwraps an API response envelope and returns the data payload
 * Throws ApiResponseError if the response indicates failure
 * 
 * @template T - The type of data payload
 * @param response - The API response envelope
 * @returns The unwrapped data payload
 * @throws {ApiResponseError} When success is false or data is missing
 * 
 * @example
 * ```typescript
 * const response = await http.get<ApiResponse<User>>('/api/users/1');
 * const user = unwrap(response);
 * ```
 */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    if (response.error) {
      throw ApiResponseError.fromApiError(response.error);
    }
    throw new ApiResponseError(
      'UNKNOWN_ERROR',
      response.message || 'An unknown error occurred',
      undefined,
      new Date().toISOString()
    );
  }

  if (response.data === undefined || response.data === null) {
    throw new ApiResponseError(
      'NO_DATA',
      'Response succeeded but contained no data',
      undefined,
      new Date().toISOString()
    );
  }

  return response.data;
}

/**
 * Validates that a response has the expected API envelope structure
 * This can be used as a type guard or validation check
 * 
 * @param response - The response to validate
 * @returns true if response has valid envelope structure
 */
export function isApiResponse<T = any>(response: any): response is ApiResponse<T> {
  return (
    response !== null &&
    typeof response === 'object' &&
    'success' in response &&
    typeof response.success === 'boolean'
  );
}

/**
 * Normalizes various error formats into a consistent ApiError structure
 * Useful for handling legacy responses or non-standard error formats
 * 
 * @param error - The error to normalize
 * @returns A normalized ApiError object
 */
export function normalizeError(error: any): ApiError {
  // If it's already an ApiError, return as-is
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as ApiError;
  }

  // If it's a string, wrap it
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      timestamp: new Date().toISOString(),
    };
  }

  // If it's an Error object
  if (error instanceof Error) {
    return {
      code: 'CLIENT_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }

  // Default fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    details: error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wraps data in a successful API response envelope
 * Useful for creating mock responses or transforming legacy data
 * 
 * @template T - The type of data payload
 * @param data - The data to wrap
 * @param message - Optional success message
 * @param meta - Optional metadata
 * @returns A properly formatted API response
 */
export function wrapSuccess<T, M = Record<string, any>>(
  data: T,
  message?: string,
  meta?: M
): ApiResponse<T, M> {
  return {
    success: true,
    message: message || null,
    error: null,
    data,
    meta,
  };
}

/**
 * Wraps an error in a failed API response envelope
 * Useful for creating mock error responses or transforming legacy errors
 * 
 * @param error - The error to wrap
 * @param message - Optional error message override
 * @returns A properly formatted API error response
 */
export function wrapError(error: ApiError | string, message?: string): ApiResponse<never> {
  const normalizedError = typeof error === 'string' ? normalizeError(error) : error;

  return {
    success: false,
    message: message || null,
    error: normalizedError,
    data: null,
  };
}
