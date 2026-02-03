# Backend Integration Guide

This document explains how to run the Open ERP frontend against the backend API.

## Overview

The frontend has been updated to call real backend APIs instead of using mock data. The User List module now integrates with the actual backend endpoints.

## Backend Repository

The backend code is located at: [open-erp-backend](https://github.com/min3rd/open-erp-backend)

Specifically, the User module backend: [open-erp-backend/apps/user](https://github.com/min3rd/open-erp-backend/tree/develop/apps/user)

## API Endpoints

### User Management API

**Base URL:** `http://localhost:3002` (configurable via `API_URI_USER` in `src/core/constant.ts`)

#### Get Users List
```
GET /v1/users
```

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `size` (number, default: 10) - Number of results per page
- `q` (string, optional) - Search query to filter users by name, email, username, or phone
- `organizationId` (string, optional) - Filter users by organization (when scope is 'organization')

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "phone": "string",
      "avatar": "string",
      "status": "active" | "inactive" | "blocked",
      "lastLogin": "ISO8601 date",
      "createdAt": "ISO8601 date"
    }
  ],
  "total": number,
  "page": number,
  "limit": number
}
```

#### Block Users
```
POST /v1/users/block
```

**Request Body:**
```json
{
  "userIds": ["string"]
}
```

#### Revoke Login Sessions
```
POST /v1/users/revoke-sessions
```

**Request Body:**
```json
{
  "userIds": ["string"]
}
```

#### Export to CSV
```
POST /v1/users/export
```

**Query Parameters:**
- `q` (string, optional) - Search query
- `organizationId` (string, optional) - Filter by organization

**Response:** Binary CSV file

## Running Frontend with Backend

### Prerequisites

1. Install backend dependencies
2. Start the backend services

### Step 1: Start Backend Services

```bash
# Clone backend repository
git clone https://github.com/min3rd/open-erp-backend.git
cd open-erp-backend

# Install dependencies
npm install

# Start the user service
npm run start:user
```

The user service should be running on `http://localhost:3002`

### Step 2: Configure Frontend

The frontend is already configured to use the backend API through the `API_URI_USER` constant in `src/core/constant.ts`. The default configuration is:

```typescript
export const API_URI_USER = 'http://localhost:3002';
```

If your backend is running on a different port, update this constant.

### Step 3: Handle CORS (if needed)

If you encounter CORS issues, you have two options:

#### Option 1: Configure Backend CORS
Update the backend CORS configuration to allow requests from `http://localhost:4200` (Angular dev server).

#### Option 2: Use Angular Proxy
Create `proxy.conf.json` in the project root:

```json
{
  "/api/user": {
    "target": "http://localhost:3002",
    "secure": false,
    "pathRewrite": {
      "^/api/user": ""
    },
    "changeOrigin": true
  }
}
```

Update `angular.json` to use the proxy:

```json
{
  "projects": {
    "open-erp-web": {
      "architect": {
        "serve": {
          "options": {
            "proxyConfig": "proxy.conf.json"
          }
        }
      }
    }
  }
}
```

Then update `src/core/constant.ts`:

```typescript
export const API_URI_USER = '/api/user';
```

### Step 4: Start Frontend

```bash
npm start
```

Navigate to `http://localhost:4200` and go to the User List page.

## Authentication

All API requests require authentication. The frontend automatically includes the JWT token in requests through Angular's HTTP interceptor.

### Token Management

- Access tokens are stored in localStorage (encrypted in production, plaintext in dev mode)
- If a request returns 401 Unauthorized, the user will be redirected to login
- If a request returns 403 Forbidden, an error message will be displayed

## Error Handling

The User Service includes comprehensive error handling:

- **401 Unauthorized** - "Unauthorized. Please login again."
- **403 Forbidden** - "Forbidden. You do not have permission to perform this action."
- **404 Not Found** - "Resource not found."
- **500 Internal Server Error** - "Internal server error. Please try again later."
- **Network Errors** - "Network error: [error message]"

Errors are displayed to users via PrimeNG toast notifications.

## Development vs Production

### Development Mode
- Tokens are stored in plaintext in localStorage for easier debugging
- API base URLs point to localhost
- CORS should be configured appropriately

### Production Mode
- Tokens are encrypted before storing in localStorage
- API base URLs should point to production endpoints
- Use environment variables or build-time configuration for API URLs

## Testing

### Unit Tests
Tests use `HttpTestingController` to mock HTTP requests:

```typescript
import { HttpTestingController } from '@angular/common/http/testing';

it('should fetch users', () => {
  service.getUsers({ page: 1, limit: 10 }).subscribe(response => {
    expect(response.data.length).toBe(1);
  });

  const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=10`);
  req.flush({ data: [mockUser], total: 1, page: 1, limit: 10 });
});
```

### Integration Tests
For E2E testing, you can either:
1. Run tests against a real backend instance
2. Mock the backend API using tools like MSW (Mock Service Worker)
3. Use a test-specific backend with seeded data

## Troubleshooting

### Issue: CORS errors
**Solution:** Configure backend CORS or use Angular proxy (see Step 3 above)

### Issue: 401 Unauthorized
**Solution:** Ensure you're logged in and have a valid JWT token

### Issue: Connection refused
**Solution:** Verify backend services are running on the correct ports

### Issue: Empty user list
**Solution:** Check that the backend database has user data. You may need to seed the database.

## Environment Configuration

For different environments, create environment-specific files:

### src/environments/environment.development.ts
```typescript
export const environment = {
  production: false,
  apiUserUrl: 'http://localhost:3002',
};
```

### src/environments/environment.production.ts
```typescript
export const environment = {
  production: true,
  apiUserUrl: 'https://api.yourdomain.com/user',
};
```

Then update `src/core/constant.ts` to use the environment config:

```typescript
import { environment } from '../environments/environment';

export const API_URI_USER = environment.apiUserUrl;
```

## Additional Resources

- [Backend API Documentation](https://github.com/min3rd/open-erp-backend/tree/develop/docs)
- [Angular HTTP Client Guide](https://angular.dev/guide/http)
- [PrimeNG Components](https://primeng.org/)
