# API Contract Documentation

This document describes the standardized API response structure used in Open ERP Web frontend, following the backend API envelope format.

## Table of Contents
- [Overview](#overview)
- [Core Interfaces](#core-interfaces)
- [Response Types](#response-types)
- [Usage Examples](#usage-examples)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

## Overview

All backend API responses follow a standardized envelope structure to ensure consistent error handling, data access, and metadata management across the application.

### Benefits
- **Consistent error handling**: All errors follow the same structure
- **Type safety**: Full TypeScript support with generics
- **Metadata support**: Extensible metadata for pagination, sorting, etc.
- **Backwards compatibility**: Support for both new and legacy response formats during migration

## Core Interfaces

All interfaces are defined in `src/core/api/interfaces.ts` and can be imported from `src/core/api`:

```typescript
import { ApiResponse, ApiPaginatedResponse, ApiSingleResponse } from '@/core/api';
```

### ApiError

Represents an error in API responses:

```typescript
interface ApiError {
  code: string;           // Error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR')
  message: string;        // Human-readable error message
  details?: Record<string, any>;  // Additional error details
  timestamp?: string;     // ISO 8601 timestamp
}
```

### ApiResponse<T, M>

Generic API response envelope:

```typescript
interface ApiResponse<T = any, M = Record<string, any>> {
  success: boolean;       // Indicates if request succeeded
  message?: string | null;  // Optional success/error message
  error?: ApiError | null;  // Error details (when success is false)
  data?: T | null;        // Response payload
  meta?: M;              // Optional metadata
}
```

**Type Parameters:**
- `T` - The type of data payload
- `M` - The type of metadata (defaults to `Record<string, any>`)

### ApiPaginatedData<T>

Structure for paginated data:

```typescript
interface ApiPaginatedData<T> {
  items: T[];            // Array of items
  query?: Record<string, any>;  // Query parameters used
  page: number;          // Current page number (1-indexed)
  limit: number;         // Items per page
  total: number;         // Total number of items
  totalPages: number;    // Total number of pages
  sort?: {
    by?: string;         // Sort field
    order?: 'asc' | 'desc';  // Sort order
  };
}
```

### ApiPaginatedResponse<T>

Type alias for paginated responses:

```typescript
type ApiPaginatedResponse<T> = ApiResponse<ApiPaginatedData<T>>;
```

### ApiSingleData<T>

Structure for single item responses:

```typescript
interface ApiSingleData<T> {
  mode: 'get' | 'create' | 'update' | 'delete';  // Operation type
  item?: T | null;       // The item (may be null for delete)
}
```

### ApiSingleResponse<T>

Type alias for single item responses:

```typescript
type ApiSingleResponse<T> = ApiResponse<ApiSingleData<T>>;
```

### KeyValue<K, V>

Generic key-value type:

```typescript
type KeyValue<K extends string | number, V> = Record<K, V>;
```

## Response Types

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "id": "123",
    "name": "Example"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Operation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "data": null
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "1", "name": "Item 1" },
      { "id": "2", "name": "Item 2" }
    ],
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "sort": {
      "by": "createdAt",
      "order": "desc"
    }
  }
}
```

## Usage Examples

### Basic Data Fetching

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, unwrap, isApiResponse } from '@/core/api';

interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUser(id: string): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`/api/users/${id}`)
      .pipe(
        map((response) => {
          // Check if response has API envelope structure
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          // Legacy format fallback
          return response as User;
        })
      );
  }
}
```

### Paginated Data

```typescript
import { ApiPaginatedResponse, unwrap } from '@/core/api';

interface Product {
  id: string;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProducts(page: number, limit: number): Observable<ApiPaginatedData<Product>> {
    const params = { page: page.toString(), limit: limit.toString() };
    
    return this.http
      .get<ApiPaginatedResponse<Product>>('/api/products', { params })
      .pipe(
        map((response) => unwrap(response))
      );
  }
}
```

### Single Item Operations

```typescript
import { ApiSingleResponse, unwrap } from '@/core/api';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private http = inject(HttpClient);

  createOrganization(data: CreateOrgDto): Observable<Organization> {
    return this.http
      .post<ApiSingleResponse<Organization>>('/api/organizations', data)
      .pipe(
        map((response) => {
          const result = unwrap(response);
          return result.item!;
        })
      );
  }

  updateOrganization(id: string, data: UpdateOrgDto): Observable<Organization> {
    return this.http
      .patch<ApiSingleResponse<Organization>>(`/api/organizations/${id}`, data)
      .pipe(
        map((response) => {
          const result = unwrap(response);
          // result.mode will be 'update'
          return result.item!;
        })
      );
  }
}
```

### Error Handling

```typescript
import { ApiResponseError, unwrap } from '@/core/api';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

getUser(id: string): Observable<User> {
  return this.http
    .get<ApiResponse<User>>(`/api/users/${id}`)
    .pipe(
      map((response) => unwrap(response)),
      catchError((error) => {
        if (error instanceof ApiResponseError) {
          // Structured API error
          console.error(`Error ${error.code}: ${error.message}`);
          if (error.details) {
            console.error('Details:', error.details);
          }
        } else {
          // HTTP or network error
          console.error('Unexpected error:', error);
        }
        return throwError(() => error);
      })
    );
}
```

### Component Usage

```typescript
import { Component, signal, inject } from '@angular/core';
import { UserService } from '@/core/services/user-service';

@Component({
  selector: 'app-user-list',
  template: `
    @if (loading()) {
      <p>Loading...</p>
    } @else if (error()) {
      <p>Error: {{ error() }}</p>
    } @else {
      <ul>
        @for (user of users(); track user.id) {
          <li>{{ user.name }}</li>
        }
      </ul>
      <p>Total: {{ total() }} users</p>
    }
  `
})
export class UserListComponent {
  private userService = inject(UserService);
  
  users = signal<User[]>([]);
  total = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    
    this.userService.getUsers({ page: 1, limit: 10 }).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
```

## Migration Guide

### Step 1: Update Service Methods

Update your service methods to handle both new and legacy response formats:

```typescript
// Before
getUsers(): Observable<User[]> {
  return this.http.get<User[]>('/api/users');
}

// After
getUsers(): Observable<User[]> {
  return this.http
    .get<ApiResponse<User[]> | User[]>('/api/users')
    .pipe(
      map((response) => {
        if (isApiResponse(response)) {
          return unwrap(response as ApiResponse<User[]>);
        }
        // Legacy format
        console.warn('Received legacy response format');
        return response as User[];
      })
    );
}
```

### Step 2: Update Tests

Update your test mocks to use the new envelope format:

```typescript
// Before
const mockUsers = [
  { id: '1', name: 'User 1' },
  { id: '2', name: 'User 2' }
];
req.flush(mockUsers);

// After
import { wrapSuccess } from '@/core/api';

const mockResponse = wrapSuccess([
  { id: '1', name: 'User 1' },
  { id: '2', name: 'User 2' }
]);
req.flush(mockResponse);
```

### Step 3: Verify Components Work

Most components should work without changes if the service layer properly unwraps responses. However, check for:
- Direct HTTP calls in components (should use services instead)
- Error handling code that expects specific error formats
- Custom response transformations

## Best Practices

### 1. Always Use Type Parameters

```typescript
// Good
const response = await http.get<ApiResponse<User>>('/api/users/1');

// Bad
const response = await http.get('/api/users/1');
```

### 2. Use unwrap() for Data Access

```typescript
// Good
const user = unwrap(response);

// Bad
const user = response.data; // Not type-safe, doesn't handle errors
```

### 3. Handle Both Formats During Migration

```typescript
// Good - handles both formats
if (isApiResponse(response)) {
  return unwrap(response);
}
return response as LegacyType;

// Bad - assumes format
return response.data;
```

### 4. Provide Meaningful Error Messages

```typescript
// Good
catch ((error) => {
  if (error instanceof ApiResponseError) {
    this.showError(`Failed to load user: ${error.message}`);
  }
})

// Bad
catch ((error) => {
  this.showError('Error');
})
```

### 5. Use Helper Functions

```typescript
// Good - use wrapSuccess/wrapError for mocks
const mockResponse = wrapSuccess(data, 'Success message');

// Bad - manually construct
const mockResponse = {
  success: true,
  data: data,
  error: null,
  message: 'Success message'
};
```

### 6. Document Custom Meta Types

```typescript
// Good - document metadata structure
interface PaginationMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  timestamp: string;
}

type UserListResponse = ApiResponse<User[], PaginationMeta>;

// Bad - untyped metadata
type UserListResponse = ApiResponse<User[]>;
```

## Utilities Reference

### unwrap<T>(response: ApiResponse<T>): T
Extracts data from response envelope. Throws `ApiResponseError` if response indicates failure.

### isApiResponse(response: any): boolean
Type guard to check if response has API envelope structure.

### normalizeError(error: any): ApiError
Converts various error formats into `ApiError` structure.

### wrapSuccess<T>(data: T, message?: string, meta?: any): ApiResponse<T>
Creates a successful API response envelope.

### wrapError(error: ApiError | string, message?: string): ApiResponse<never>
Creates an error API response envelope.

### ApiResponseError
Custom error class for API errors with `code`, `message`, `details`, and `timestamp` properties.

## Related Resources

- Backend API Envelope: [min3rd/open-erp#30](https://github.com/min3rd/open-erp/issues/30)
- TypeScript Handbook: [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- RxJS Documentation: [Operators](https://rxjs.dev/guide/operators)
