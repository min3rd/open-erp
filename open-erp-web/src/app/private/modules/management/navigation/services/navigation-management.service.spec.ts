import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NavigationManagementService } from './navigation-management.service';
import { API_URI_CONFIG } from '../../../../../../core/constant';
import { NavigationItemDto, CreateNavigationItemDto, UpdateNavigationItemDto } from '../dto/navigation-item.dto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('NavigationManagementService', () => {
  let service: NavigationManagementService;
  let httpMock: HttpTestingController;
  const baseUrl = `${API_URI_CONFIG}/v1/navigations`;

  const mockNavigationItem: NavigationItemDto = {
    id: 'nav-1',
    label: 'Dashboard',
    icon: 'pi pi-home',
    routerLink: '/dashboard',
    scope: 'global',
    order: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NavigationManagementService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NavigationManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGlobalNavigation', () => {
    it('should retrieve global navigation items', () => {
      const mockResponse = {
        items: [mockNavigationItem],
        total: 1,
      };

      service.getGlobalNavigation().subscribe((items) => {
        expect(items).toEqual(mockResponse.items);
        expect(items.length).toBe(1);
        expect(items[0].label).toBe('Dashboard');
      });

      const req = httpMock.expectOne(`${baseUrl}/global`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include hidden items when specified', () => {
      const mockResponse = {
        items: [mockNavigationItem],
        total: 1,
      };

      service.getGlobalNavigation({ includeHidden: true }).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle errors', () => {
      service.getGlobalNavigation().subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('error');
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/global`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getModuleNavigation', () => {
    it('should retrieve module navigation items', () => {
      const moduleKey = 'user-management';
      const mockResponse = {
        items: [mockNavigationItem],
        total: 1,
      };

      service.getModuleNavigation(moduleKey).subscribe((items) => {
        expect(items).toEqual(mockResponse.items);
        expect(items.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/module/${moduleKey}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getNavigationItem', () => {
    it('should retrieve a single navigation item by ID', () => {
      service.getNavigationItem('nav-1').subscribe((item) => {
        expect(item).toEqual(mockNavigationItem);
        expect(item.id).toBe('nav-1');
      });

      const req = httpMock.expectOne(`${baseUrl}/nav-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockNavigationItem);
    });
  });

  describe('createNavigationItem', () => {
    it('should create a new navigation item', () => {
      const createDto: CreateNavigationItemDto = {
        id: 'nav-new',
        label: 'New Item',
        icon: 'pi pi-plus',
        scope: 'global',
        order: 1,
      };

      service.createNavigationItem(createDto).subscribe((item) => {
        expect(item.label).toBe('New Item');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush({ ...mockNavigationItem, ...createDto });
    });

    it('should invalidate cache after creation', () => {
      const createDto: CreateNavigationItemDto = {
        id: 'nav-cache',
        label: 'New Item',
        scope: 'global',
        order: 1,
      };

      service.createNavigationItem(createDto).subscribe();

      const req = httpMock.expectOne(baseUrl);
      req.flush({ ...mockNavigationItem, ...createDto });

      // Verify cache is invalidated by checking if subsequent request fetches fresh data
      service.getCachedGlobalNavigation().subscribe((cached) => {
        expect(cached).toBeNull();
      });
    });
  });

  describe('updateNavigationItem', () => {
    it('should update an existing navigation item', () => {
      const updateDto: UpdateNavigationItemDto = {
        id: 'nav-1',
        label: 'Updated Label',
      };

      service.updateNavigationItem('nav-1', updateDto).subscribe((item) => {
        expect(item.label).toBe('Updated Label');
      });

      const req = httpMock.expectOne(`${baseUrl}/nav-1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateDto);
      req.flush({ ...mockNavigationItem, ...updateDto });
    });
  });

  describe('deleteNavigationItem', () => {
    it('should delete a navigation item', () => {
      service.deleteNavigationItem('nav-1').subscribe((result) => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/nav-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should invalidate all caches after deletion', () => {
      service.deleteNavigationItem('nav-1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/nav-1`);
      req.flush(null);

      // Verify cache is invalidated
      service.getCachedGlobalNavigation().subscribe((cached) => {
        expect(cached).toBeNull();
      });
    });
  });

  describe('reorderNavigationItems', () => {
    it('should reorder navigation items', () => {
      const reorderItems = [
        { id: 'nav-1', newOrder: 1 },
        { id: 'nav-2', newOrder: 0 },
      ];

      service.reorderNavigationItems(reorderItems).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/reorder`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ items: reorderItems });
      req.flush(null);
    });
  });

  describe('moveNavigationItem', () => {
    it('should move a navigation item', () => {
      const moveDto = {
        id: 'nav-1',
        targetParentId: 'nav-parent',
        targetOrder: 2,
      };

      service.moveNavigationItem(moveDto).subscribe((item) => {
        expect(item).toBeDefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/move`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(moveDto);
      req.flush(mockNavigationItem);
    });
  });

  describe('previewNavigationWithPermissions', () => {
    it('should preview global navigation with permissions', () => {
      const permissions = {
        permissions: ['user.read', 'user.write'],
      };
      const mockResponse = {
        items: [mockNavigationItem],
        total: 1,
      };

      service.previewNavigationWithPermissions('global', permissions).subscribe((items) => {
        expect(items).toEqual(mockResponse.items);
      });

      const req = httpMock.expectOne(`${baseUrl}/preview/global`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(permissions);
      req.flush(mockResponse);
    });

    it('should preview module navigation with permissions', () => {
      const permissions = {
        permissions: ['module.read'],
      };
      const moduleKey = 'user-management';
      const mockResponse = {
        items: [mockNavigationItem],
        total: 1,
      };

      service
        .previewNavigationWithPermissions('module', permissions, moduleKey)
        .subscribe((items) => {
          expect(items).toEqual(mockResponse.items);
        });

      const req = httpMock.expectOne(`${baseUrl}/preview/module/${moduleKey}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(permissions);
      req.flush(mockResponse);
    });
  });

  describe('caching', () => {
    it('should cache global navigation items', () => {
      const mockResponse = {
        items: [mockNavigationItem],
        total: 1,
      };

      service.getGlobalNavigation().subscribe();
      const req = httpMock.expectOne(`${baseUrl}/global`);
      req.flush(mockResponse);

      service.getCachedGlobalNavigation().subscribe((cached) => {
        expect(cached).toEqual(mockResponse.items);
      });
    });

    it('should cache module navigation items', () => {
      const moduleKey = 'user-management';
      const mockResponse = {
        items: [mockNavigationItem],
        total: 1,
      };

      service.getModuleNavigation(moduleKey).subscribe();
      const req = httpMock.expectOne(`${baseUrl}/module/${moduleKey}`);
      req.flush(mockResponse);

      service.getCachedModuleNavigation(moduleKey).subscribe((cached) => {
        expect(cached).toEqual(mockResponse.items);
      });
    });
  });

  describe('error handling', () => {
    it('should handle 400 Bad Request', () => {
      service.createNavigationItem({ id: 'nav-error', label: 'Test', scope: 'global', order: 0 }).subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('Bad request');
        },
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 401 Unauthorized', () => {
      service.getGlobalNavigation().subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('Unauthorized');
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/global`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 404 Not Found', () => {
      service.getNavigationItem('non-existent').subscribe({
        next: () => {
          throw new Error('should have failed');
        },
        error: (error) => {
          expect(error.message).toContain('not found');
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/non-existent`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
