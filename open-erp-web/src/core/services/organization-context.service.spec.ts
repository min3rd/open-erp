import { TestBed } from '@angular/core/testing';
import { OrganizationContextService, OrganizationMetadata } from './organization-context.service';

describe('OrganizationContextService', () => {
  let service: OrganizationContextService;

  const mockOrganizations: OrganizationMetadata[] = [
    {
      id: 'org-1',
      name: 'Organization One',
      internationalName: 'Org One',
      taxId: '1234567890',
    },
    {
      id: 'org-2',
      name: 'Organization Two',
      internationalName: 'Org Two',
      taxId: '0987654321',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizationContextService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('User Organizations', () => {
    it('should initialize with empty organizations', () => {
      expect(service.userOrganizations()).toEqual([]);
    });

    it('should set user organizations', () => {
      service.setUserOrganizations(mockOrganizations);
      expect(service.userOrganizations()).toEqual(mockOrganizations);
    });

    it('should automatically select first organization when setting organizations', () => {
      service.setUserOrganizations(mockOrganizations);
      expect(service.currentOrganization()).toEqual(mockOrganizations[0]);
    });
  });

  describe('Current Organization', () => {
    beforeEach(() => {
      service.setUserOrganizations(mockOrganizations);
    });

    it('should set current organization', () => {
      service.setCurrentOrganization(mockOrganizations[1]);
      expect(service.currentOrganization()).toEqual(mockOrganizations[1]);
    });

    it('should clear current organization', () => {
      service.setCurrentOrganization(mockOrganizations[0]);
      service.clearCurrentOrganization();
      expect(service.currentOrganization()).toBeNull();
    });

    it('should switch organization by ID', () => {
      const success = service.switchOrganization('org-2');
      expect(success).toBe(true);
      expect(service.currentOrganization()).toEqual(mockOrganizations[1]);
    });

    it('should return false when switching to non-existent organization', () => {
      const success = service.switchOrganization('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('Organization Change Events', () => {
    it('should emit organization changed event', (done) => {
      service.setUserOrganizations(mockOrganizations);

      service.organizationChanged$.subscribe((org) => {
        expect(org).toEqual(mockOrganizations[1]);
        done();
      });

      service.setCurrentOrganization(mockOrganizations[1]);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist current organization ID to localStorage', async () => {
      service.setUserOrganizations(mockOrganizations);
      service.setCurrentOrganization(mockOrganizations[1]);

      // Wait for effect to run
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(localStorage.getItem('app.organization.currentOrgId')).toBe('org-2');
    });

    it('should restore saved organization on initialization', async () => {
      // Set a saved org ID before creating service
      localStorage.setItem('app.organization.currentOrgId', 'org-2');

      // Create new service instance
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(OrganizationContextService);

      // Set organizations - should restore saved org
      newService.setUserOrganizations(mockOrganizations);

      expect(newService.currentOrganization()).toEqual(mockOrganizations[1]);
    });

    it('should clear localStorage when clearing organization', async () => {
      service.setUserOrganizations(mockOrganizations);
      service.setCurrentOrganization(mockOrganizations[0]);

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(localStorage.getItem('app.organization.currentOrgId')).toBeTruthy();

      service.clearCurrentOrganization();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(localStorage.getItem('app.organization.currentOrgId')).toBeNull();
    });
  });
});
