# Contributing to Open ERP Web

Thank you for your interest in contributing to Open ERP Web! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Style and Standards](#code-style-and-standards)
- [API Response Handling](#api-response-handling)
- [DOM Element ID Requirements](#dom-element-id-requirements)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/open-erp-web.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm test`
7. Build the project: `npm run build`
8. Commit your changes: `git commit -m "feat: your feature description"`
9. Push to your fork: `git push origin feature/your-feature-name`
10. Create a Pull Request

## Code Style and Standards

### TypeScript

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Follow the existing code style and patterns

### Angular

- Use standalone components (default in Angular v20+)
- Use signals for state management
- Implement lazy loading for feature routes
- Use `input()` and `output()` functions instead of decorators
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in component decorators
- Prefer Reactive forms over Template-driven forms
- Use native control flow (`@if`, `@for`, `@switch`) instead of structural directives

## API Response Handling

All API responses follow a standardized envelope structure. Always use the provided utilities when working with backend APIs.

### Import Core API Types

```typescript
import { 
  ApiResponse, 
  ApiPaginatedResponse, 
  ApiSingleResponse,
  unwrap,
  isApiResponse 
} from '@/core/api';
```

### Recommended Patterns

#### 1. Fetching Single Items

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiSingleResponse, unwrap, isApiResponse } from '@/core/api';

@Injectable({ providedIn: 'root' })
export class MyService {
  private http = inject(HttpClient);

  getItem(id: string): Observable<Item> {
    return this.http
      .get<ApiSingleResponse<Item> | Item>(`/api/items/${id}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item!;
          }
          // Legacy format fallback
          return response as Item;
        })
      );
  }
}
```

#### 2. Fetching Paginated Lists

```typescript
import { ApiPaginatedResponse, unwrap, isApiResponse } from '@/core/api';

interface ListResponse {
  data: Item[];
  total: number;
  page: number;
  limit: number;
}

getItems(page: number, limit: number): Observable<ListResponse> {
  const params = { page: page.toString(), limit: limit.toString() };
  
  return this.http
    .get<ApiPaginatedResponse<Item> | ListResponse>(`/api/items`, { params })
    .pipe(
      map((response) => {
        if (isApiResponse(response)) {
          const data = unwrap(response);
          // Transform ApiPaginatedData to your component's expected format
          return {
            data: data.items,
            total: data.total,
            page: data.page,
            limit: data.limit,
          };
        }
        // Legacy format
        return response as ListResponse;
      })
    );
}
```

#### 3. Creating/Updating Items

```typescript
import { ApiSingleResponse, unwrap } from '@/core/api';

createItem(data: CreateItemDto): Observable<Item> {
  return this.http
    .post<ApiSingleResponse<Item>>(`/api/items`, data)
    .pipe(
      map((response) => {
        if (isApiResponse(response)) {
          const result = unwrap(response);
          // result.mode will be 'create'
          return result.item!;
        }
        return response as Item;
      })
    );
}
```

#### 4. Error Handling

```typescript
import { ApiResponseError, unwrap } from '@/core/api';
import { catchError, throwError } from 'rxjs';

getItem(id: string): Observable<Item> {
  return this.http
    .get<ApiSingleResponse<Item>>(`/api/items/${id}`)
    .pipe(
      map((response) => {
        const data = unwrap(response);
        return data.item!;
      }),
      catchError((error) => {
        if (error instanceof ApiResponseError) {
          console.error(`API Error ${error.code}: ${error.message}`);
          if (error.details) {
            console.error('Details:', error.details);
          }
        }
        return throwError(() => error);
      })
    );
}
```

#### 5. Testing with Mock Responses

```typescript
import { wrapSuccess, wrapError } from '@/core/api';

// In your test file
it('should fetch item successfully', () => {
  const mockItem = { id: '1', name: 'Test Item' };
  const mockResponse = wrapSuccess(
    { mode: 'get' as const, item: mockItem },
    'Item retrieved successfully'
  );

  service.getItem('1').subscribe((item) => {
    expect(item.id).toBe('1');
    expect(item.name).toBe('Test Item');
  });

  const req = httpMock.expectOne('/api/items/1');
  req.flush(mockResponse);
});

it('should handle error responses', () => {
  const mockError = wrapError({
    code: 'NOT_FOUND',
    message: 'Item not found',
  });

  service.getItem('999').subscribe({
    next: () => fail('Should have thrown error'),
    error: (error) => {
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Item not found');
    }
  });

  const req = httpMock.expectOne('/api/items/999');
  req.flush(mockError);
});
```

### Key Principles

1. **Always use type parameters**: `ApiResponse<MyType>` not `ApiResponse`
2. **Use `unwrap()` for data access**: Handles errors and null checks automatically
3. **Support both formats during migration**: Use `isApiResponse()` to check format
4. **Handle errors gracefully**: Check for `ApiResponseError` in catch blocks
5. **Use helper functions in tests**: `wrapSuccess()` and `wrapError()` for consistency

### Additional Resources

For comprehensive documentation on API response handling, see [docs/api-contract.md](./docs/api-contract.md).


## DOM Element ID Requirements

**CRITICAL: All DOM elements MUST have unique `id` attributes throughout the entire application.**

### Why IDs are Required

1. **Accessibility**: Screen readers and assistive technologies rely on unique IDs for proper navigation and context
2. **Testing**: Automated tests use IDs to locate and interact with elements reliably
3. **Debugging**: Unique IDs make it easier to trace and debug issues in the browser and logs
4. **SEO**: Search engines use IDs to understand page structure better
5. **Form Labels**: Labels must reference form inputs by ID for accessibility compliance

### ID Naming Convention

All IDs must follow these rules:

- **Format**: Use `kebab-case` (all lowercase with hyphens)
- **Prefix**: Always prefix with the component/page name
- **Descriptive**: Use names that clearly indicate the element's purpose
- **Unique**: Must be unique across the entire application, not just within a component

### ID Patterns

#### Form Elements

```html
<!-- Pattern: {component}-{field-name} -->
<input id="login-username" type="text" />
<input id="register-email" type="email" />
<input id="profile-phone-number" type="tel" />
```

#### Error Messages

```html
<!-- Pattern: {component}-{field-name}-error -->
<small id="login-username-error">Username is required</small>
<small id="register-email-error">Invalid email format</small>
```

#### Buttons

```html
<!-- Pattern: {component}-{action}-button -->
<button id="login-submit-button">Login</button>
<button id="register-cancel-button">Cancel</button>
<button id="profile-save-button">Save</button>
```

#### Containers and Sections

```html
<!-- Pattern: {component}-{section}-{type} -->
<div id="login-container">...</div>
<div id="login-form-wrapper">...</div>
<div id="dashboard-header">...</div>
<section id="profile-details-section">...</section>
```

#### Navigation Elements

```html
<!-- Pattern: {context}-{element}-{purpose} -->
<nav id="main-navigation">...</nav>
<div id="sidebar-menu">...</div>
<a id="nav-home-link" href="/">Home</a>
```

### Complete Example

```html
<!-- Login Component -->
<div id="login-container">
  <div id="login-left-panel">
    <h1 id="login-title">Welcome Back</h1>
  </div>
  
  <div id="login-right-panel">
    <form id="login-form">
      <!-- Username Field -->
      <div id="login-username-wrapper">
        <label for="login-username">Username</label>
        <input 
          id="login-username" 
          type="text"
          aria-describedby="login-username-error"
        />
        <small id="login-username-error">Username is required</small>
      </div>
      
      <!-- Password Field -->
      <div id="login-password-wrapper">
        <label for="login-password">Password</label>
        <input 
          id="login-password" 
          type="password"
          aria-describedby="login-password-error"
        />
        <small id="login-password-error">Password is required</small>
      </div>
      
      <!-- Actions -->
      <div id="login-actions">
        <button id="login-submit-button" type="submit">Login</button>
        <button id="login-forgot-password-button" type="button">
          Forgot Password?
        </button>
      </div>
    </form>
  </div>
</div>
```

### Common Mistakes to Avoid

❌ **DON'T** reuse IDs across different components:
```html
<!-- login.html -->
<input id="email" />

<!-- register.html -->
<input id="email" />  <!-- ❌ DUPLICATE! -->
```

✅ **DO** prefix with component name:
```html
<!-- login.html -->
<input id="login-email" />

<!-- register.html -->
<input id="register-email" />  <!-- ✅ UNIQUE! -->
```

❌ **DON'T** use generic IDs:
```html
<button id="btn">Submit</button>  <!-- ❌ TOO GENERIC -->
<div id="container">...</div>      <!-- ❌ TOO GENERIC -->
```

✅ **DO** use specific, descriptive IDs:
```html
<button id="login-submit-button">Submit</button>  <!-- ✅ SPECIFIC -->
<div id="login-form-container">...</div>          <!-- ✅ SPECIFIC -->
```

### Tools for Validation

Before submitting a PR, verify that all IDs are unique:

```bash
# Check for duplicate IDs
grep -r 'id="' src --include="*.html" | \
  awk -F'id="' '{print $2}' | \
  awk -F'"' '{print $1}' | \
  sort | uniq -c | \
  sort -rn | \
  awk '$1 > 1 {print "DUPLICATE: " $2 " (appears " $1 " times)"}'
```

If this command returns any output, you have duplicate IDs that must be fixed.

## Accessibility Guidelines

- All interactive elements must have proper ARIA attributes
- Maintain proper heading hierarchy (h1 → h2 → h3)
- Ensure sufficient color contrast (WCAG AA minimum: 4.5:1 for normal text)
- All images must have meaningful `alt` text
- Forms must associate labels with inputs using `for` attribute and matching `id`
- Interactive elements must be keyboard accessible
- Test with screen readers when possible

## Testing

- Write unit tests for all new components and services
- Ensure all existing tests pass: `npm test`
- Test accessibility with browser DevTools or axe DevTools extension
- Test keyboard navigation
- Test responsive design on multiple screen sizes

## Pull Request Process

1. **Update documentation**: If your changes affect the API or user-facing features, update the relevant documentation
2. **Test thoroughly**: Run all tests and verify your changes don't break existing functionality
3. **Verify IDs**: Run the duplicate ID check command to ensure all IDs are unique
4. **Follow commit conventions**: Use conventional commits format (feat:, fix:, docs:, etc.)
5. **Create PR**: Provide a clear description of your changes and reference any related issues
6. **Code review**: Address any feedback from maintainers
7. **Merge**: Once approved, your PR will be merged

## Questions?

If you have questions or need help, please:
- Open an issue on GitHub
- Check existing issues and discussions
- Reach out to the maintainers

Thank you for contributing to Open ERP Web! 🎉
