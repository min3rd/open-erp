import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService, GetUsersParams, UserListResponse } from './user-service';
import { API_URI_USER } from '../constant';
import { ApiPaginatedResponse, wrapSuccess } from '../api';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return users with pagination', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    const mockResponse: UserListResponse = {
      data: [
        {
          id: 'user-1',
          username: 'user1',
          email: 'user1@example.com',
          fullName: 'User One',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      totalPages: 1,
    };

    service.getUsers(params).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should filter users by search query', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      totalPages: 1,
      search: 'user1',
    };

    const mockResponse: UserListResponse = {
      data: [
        {
          id: 'user-1',
          username: 'user1',
          email: 'user1@example.com',
          fullName: 'User One',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    service.getUsers(params).subscribe((response) => {
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data[0].username).toContain('user1');
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=10&q=user1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should return empty results when no users match search', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      totalPages: 1,
      search: 'nonexistentuser12345',
    };

    const mockResponse: UserListResponse = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    service.getUsers(params).subscribe((response) => {
      expect(response.data.length).toBe(0);
      expect(response.total).toBe(0);
    });

    const req = httpMock.expectOne(
      `${API_URI_USER}/v1/users?page=1&size=10&q=nonexistentuser12345`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle different page sizes', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 25,
      totalPages: 1,
    };

    const mockResponse: UserListResponse = {
      data: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 1,
    };

    service.getUsers(params).subscribe((response) => {
      expect(response.limit).toBe(25);
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=25`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle organization scope', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      totalPages: 1,
      scope: 'organization',
      organizationId: 'org-123',
    };

    const mockResponse: UserListResponse = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    service.getUsers(params).subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${API_URI_USER}/v1/users?page=1&size=10&organizationId=org-123`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should block users', () => {
    const userIds = ['user-1', 'user-2'];

    service.blockUsers(userIds).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users/block`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userIds });
    req.flush(null);
  });

  it('should revoke login sessions', () => {
    const userIds = ['user-1', 'user-2'];

    service.revokeLoginSessions(userIds).subscribe((result) => {
      expect(result).toBeUndefined();
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users/revoke-sessions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userIds });
    req.flush(null);
  });

  it('should export to CSV', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    const mockBlob = new Blob(['test'], { type: 'text/csv' });

    service.exportToCSV(params).subscribe((blob) => {
      expect(blob).toBeTruthy();
      expect(blob instanceof Blob).toBe(true);
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users/export`);
    expect(req.request.method).toBe('POST');
    req.flush(mockBlob);
  });

  it('should return users with correct structure', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 5,
      totalPages: 1,
    };

    const mockResponse: UserListResponse = {
      data: [
        {
          id: 'user-1',
          username: 'user1',
          email: 'user1@example.com',
          fullName: 'User One',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
    };

    service.getUsers(params).subscribe((response) => {
      expect(response.data).toBeTruthy();
      if (response.data.length > 0) {
        const user = response.data[0];
        expect(user.id).toBeTruthy();
        expect(user.username).toBeTruthy();
        expect(user.email).toBeTruthy();
        expect(user.fullName).toBeTruthy();
        expect(user.status).toBeTruthy();
        expect(['active', 'inactive', 'blocked']).toContain(user.status);
        expect(user.createdAt).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle HTTP errors', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    let errorCaught = false;
    service.getUsers(params).subscribe({
      next: () => {
        expect(errorCaught).toBe(true); // Should not reach here
      },
      error: (error) => {
        errorCaught = true;
        expect(error.message).toContain('Internal server error');
      },
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=10`);
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(errorCaught).toBe(true);
  });

  it('should handle 401 unauthorized errors', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    let errorCaught = false;
    service.getUsers(params).subscribe({
      next: () => {
        expect(errorCaught).toBe(true); // Should not reach here
      },
      error: (error) => {
        errorCaught = true;
        expect(error.message).toContain('Unauthorized');
      },
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=10`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(errorCaught).toBe(true);
  });

  it('should handle 403 forbidden errors', () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    let errorCaught = false;
    service.getUsers(params).subscribe({
      next: () => {
        expect(errorCaught).toBe(true); // Should not reach here
      },
      error: (error) => {
        errorCaught = true;
        expect(error.message).toContain('Forbidden');
      },
    });

    const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=10`);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(errorCaught).toBe(true);
  });

  describe('API Envelope Support', () => {
    it('should handle new API envelope format for paginated users', () => {
      const params: GetUsersParams = {
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      const mockApiResponse: ApiPaginatedResponse<any> = wrapSuccess({
        items: [
          {
            id: 'user-1',
            username: 'user1',
            email: 'user1@example.com',
            fullName: 'User One',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        page: 1,
        limit: 10,
        totalPages: 1,
        total: 1,
        totalPages: 1,
      });

      service.getUsers(params).subscribe((response) => {
        expect(response.data).toBeDefined();
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
        expect(response.page).toBe(1);
        expect(response.limit).toBe(10);
        expect(response.totalPages).toBe(1);
      });

      const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

    it('should handle API envelope error response', () => {
      const params: GetUsersParams = {
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      const mockErrorResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      };

      let errorCaught = false;
      service.getUsers(params).subscribe({
        next: () => {
          expect.fail('Should have thrown error');
        },
        error: (error) => {
          errorCaught = true;
          expect(error.message).toContain('Authentication required');
        },
      });

      const req = httpMock.expectOne(`${API_URI_USER}/v1/users?page=1&size=10`);
      req.flush(mockErrorResponse);

      expect(errorCaught).toBe(true);
    });

    it('should handle new API envelope for blockUsers', () => {
      const userIds = ['user-1', 'user-2'];
      const mockApiResponse = wrapSuccess(undefined, 'Users blocked successfully');

      service.blockUsers(userIds).subscribe((result) => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URI_USER}/v1/users/block`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userIds });
      req.flush(mockApiResponse);
    });

    it('should handle new API envelope for revokeLoginSessions', () => {
      const userIds = ['user-1', 'user-2'];
      const mockApiResponse = wrapSuccess(undefined, 'Sessions revoked successfully');

      service.revokeLoginSessions(userIds).subscribe((result) => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URI_USER}/v1/users/revoke-sessions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userIds });
      req.flush(mockApiResponse);
    });
  });
});
