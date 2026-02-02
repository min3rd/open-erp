# Vertical Layout Improvements - API Documentation

## Overview
This document details the backend API endpoints used in the Open ERP web application.

## Backend Repository
The backend APIs are defined in the `open-erp-backend` repository.

## User Management Endpoints

### Base URL
```
http://localhost:3002
```

### 1. Get Users List
**Endpoint:** `GET /v1/users`

**Description:** Get paginated list of users with optional filtering

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `size` (number, default: 10) - Results per page
- `q` (string, optional) - Search query for filtering by name, email, username, or phone
- `organizationId` (string, optional) - Filter users by organization

**Response:** `UserListResponse` (200 OK)
```typescript
{
  data: User[];
  total: number;
  page: number;
  limit: number;
}
```

**Frontend Implementation:** `UserService.getUsers()`

---

### 2. Block Users
**Endpoint:** `POST /v1/users/block`

**Description:** Block multiple users

**Request Body:**
```typescript
{
  userIds: string[];
}
```

**Response:** No content (200 OK)

**Frontend Implementation:** `UserService.blockUsers()`

---

### 3. Revoke Login Sessions
**Endpoint:** `POST /v1/users/revoke-sessions`

**Description:** Revoke login sessions for multiple users

**Request Body:**
```typescript
{
  userIds: string[];
}
```

**Response:** No content (200 OK)

**Frontend Implementation:** `UserService.revokeLoginSessions()`

---

### 4. Export Users to CSV
**Endpoint:** `POST /v1/users/export`

**Description:** Export users list to CSV format

**Query Parameters:**
- `q` (string, optional) - Search query
- `organizationId` (string, optional) - Filter by organization

**Response:** Binary CSV file (200 OK)

**Frontend Implementation:** `UserService.exportToCSV()`

---

## Organization Management Endpoints

### Base URL
```
http://localhost:3005
```

### 1. Create Organization
**Endpoint:** `POST /v1/organizations`

**Description:** Register a new organization/business in the system.

**Request Body:**
```typescript
{
  taxId: string;              // 10-13 digit tax ID
  name: string;               // Business name (Vietnamese)
  internationalName: string;  // Business name (English)
  headquartersAddress: string;
  legalRepresentative: string;
  contactPhone: string;
  contactEmail: string;
  foundedDate: string;        // ISO 8601 date format
  businessActivities?: string[];
  type: 'holding' | 'company' | 'joint-venture' | 'partner' | 'branch';
  status?: 'active' | 'inactive' | 'pending';
  country: string;
  description?: string;
  website?: string;
}
```

**Response:** `OrganizationResponse` (201 Created)

**Frontend Implementation:** `OrganizationService.createOrganization()`

---

### 2. Get Organization
**Endpoint:** `GET /v1/organizations/:id`

**Description:** Retrieve details of a specific organization.

**Path Parameters:**
- `id`: Organization ID

**Response:** `OrganizationResponse` (200 OK)

**Frontend Implementation:** `OrganizationService.getOrganization(id)`

---

### 3. Update Organization
**Endpoint:** `PATCH /v1/organizations/:id`

**Description:** Update organization details.

**Path Parameters:**
- `id`: Organization ID

**Request Body:** Partial `UpdateOrganizationDto`

**Response:** `OrganizationResponse` (200 OK)

**Frontend Implementation:** `OrganizationService.updateOrganization(id, dto)`

---

### 4. Get User's Organizations
**Endpoint:** `GET /v1/organizations/user/me` (assumed, to be confirmed)

**Description:** Get list of organizations that the current user belongs to.

**Response:**
```typescript
{
  data: OrganizationResponse[];
}
```

**Frontend Implementation:** To be implemented in `OrganizationService`

**Note:** This endpoint is currently mocked in the frontend with demo data. The actual endpoint needs to be confirmed with the backend team.

---

### 5. Get Organization Members
**Endpoint:** `GET /v1/organizations/:id/members`

**Description:** Get list of members in an organization.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)

**Response:**
```typescript
{
  data: OrganizationMember[];
  total: number;
  page: number;
  limit: number;
}
```

**Frontend Implementation:** `OrganizationService.getOrganizationMembers(id, page, limit)`

---

### 6. Invite Member
**Endpoint:** `POST /v1/organizations/:id/members/invite`

**Description:** Invite a new member to the organization.

**Request Body:**
```typescript
{
  email: string;
  role: string;
}
```

**Response:** `OrganizationMember` (201 Created)

**Frontend Implementation:** `OrganizationService.inviteMember(id, dto)`

---

### 7. Remove Member
**Endpoint:** `DELETE /v1/organizations/:id/members/:memberId`

**Description:** Remove a member from the organization.

**Response:** No content (204)

**Frontend Implementation:** `OrganizationService.removeMember(organizationId, memberId)`

---

### 8. Get Organization Relations
**Endpoint:** `GET /v1/organizations/:id/relations`

**Description:** Get related organizations (subsidiaries, partners, etc.)

**Response:** `OrganizationRelation[]` (200 OK)

**Frontend Implementation:** `OrganizationService.getOrganizationRelations(id)`

---

### 9. Get Organization Events
**Endpoint:** `GET /v1/organizations/:id/events`

**Description:** Get activity log/events for an organization.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Response:**
```typescript
{
  data: OrganizationEvent[];
  total: number;
  page: number;
  limit: number;
}
```

**Frontend Implementation:** `OrganizationService.getOrganizationEvents(id, page, limit)`

---

## External API Integration

### VietQR Business Lookup
**Endpoint:** `GET https://api.vietqr.io/v2/business/:taxId`

**Description:** Lookup business information by tax ID (Vietnamese businesses only).

**Response:**
```typescript
{
  code: string;
  desc: string;
  data: {
    id: string;
    name: string;
    internationalName: string;
    shortName: string;
    address: string;
    status: string;
  };
}
```

**Frontend Implementation:** `OrganizationService.lookupBusinessByTaxId(taxId)`

---

## LocalStorage Keys

The following localStorage keys are used by the vertical layout features:

1. **`app.nav.mode`** - Navigation mode ('narrow' | 'sidebar')
2. **`app.nav.width`** - Navigation width in pixels (56-320)
3. **`app.language`** - Selected language code ('en' | 'es')
4. **`app.organization.currentOrgId`** - Current selected organization ID
5. **`organization.nav.mode`** - Organization module nav mode (existing, kept for compatibility)

---

## Frontend Services

### UserService
Service for managing users in the application.

**Key Methods:**
- `getUsers(params)` - Get paginated list of users with optional filtering
- `blockUsers(userIds)` - Block multiple users
- `revokeLoginSessions(userIds)` - Revoke login sessions
- `exportToCSV(params)` - Export users to CSV

---

### OrganizationContextService
Global service for managing organization context across the application.

**Key Methods:**
- `setUserOrganizations(organizations)` - Set available organizations
- `setCurrentOrganization(organization)` - Set active organization
- `switchOrganization(organizationId)` - Switch to different organization
- `clearCurrentOrganization()` - Clear selection

**Observables:**
- `organizationChanged$` - Emits when organization changes

---

### LayoutService
Enhanced with resizable navigation support.

**Key Methods:**
- `toggleNavMode()` - Toggle between narrow/sidebar
- `setNavMode(mode)` - Set navigation mode
- `setNavWidth(width)` - Set navigation width (56-320px)

**Properties:**
- `navMode` - Current navigation mode signal
- `navWidth` - Current navigation width signal
- `minNavWidth` / `maxNavWidth` - Constraints

---

## Authentication & Authorization

All endpoints (except public ones) require authentication via JWT token.

### Token Management
- Tokens are automatically included in requests via HTTP interceptor
- Access tokens are stored in localStorage (encrypted in production)
- Refresh tokens are used to obtain new access tokens

### Error Responses
- **401 Unauthorized** - Invalid or expired token; redirects to login
- **403 Forbidden** - User lacks permission; shows error message
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error; shows retry option

---

## Notes

1. All organization and user endpoints require authentication via JWT token
2. The user must have appropriate permissions to perform operations
3. The organization registration flow validates tax ID format (10-13 digits)
4. VietQR API integration is optional and only works for Vietnamese businesses
5. The User List module no longer uses mock data - all data comes from the backend

---

## TODO

- [ ] Confirm GET user organizations endpoint with backend team
- [ ] Implement real API call to fetch user's organizations
- [ ] Add error handling for organization switching
- [ ] Implement retry logic for failed API calls
- [ ] Add loading states during organization operations
