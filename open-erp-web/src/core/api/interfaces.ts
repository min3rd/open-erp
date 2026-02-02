/**
 * Core API response interfaces for standardized backend communication
 * These interfaces follow the backend API envelope structure
 */

/**
 * API error structure returned when success is false
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * Generic API response envelope
 * @template T - The type of data payload
 * @template M - The type of metadata (defaults to Record<string, any>)
 */
export interface ApiResponse<T = any, M = Record<string, any>> {
  success: boolean;
  message?: string | null;
  error?: ApiError | null;
  data?: T | null;
  meta?: M;
}

/**
 * Paginated data structure
 * @template T - The type of items in the array
 */
export interface ApiPaginatedData<T> {
  items: T[];
  query?: Record<string, any>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort?: {
    by?: string;
    order?: 'asc' | 'desc';
  };
}

/**
 * API response for paginated data
 * @template T - The type of items in the paginated result
 */
export type ApiPaginatedResponse<T> = ApiResponse<ApiPaginatedData<T>>;

/**
 * Single item response with operation mode
 * @template T - The type of the item
 */
export interface ApiSingleData<T> {
  mode: 'get' | 'create' | 'update' | 'delete';
  item?: T | null;
}

/**
 * API response for single item operations
 * @template T - The type of the item
 */
export type ApiSingleResponse<T> = ApiResponse<ApiSingleData<T>>;

/**
 * Generic key-value type alias
 * @template K - Key type (string or number)
 * @template V - Value type
 */
export type KeyValue<K extends string | number, V> = Record<K, V>;
