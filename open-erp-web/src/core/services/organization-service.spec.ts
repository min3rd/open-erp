import { TestBed } from '@angular/core/testing';
import {
  OrganizationService,
  CreateOrganizationDto,
  OrganizationType,
  OrganizationStatus,
} from './organization-service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { wrapSuccess } from '../api';

describe('OrganizationService - New Field Tests', () => {
  let service: OrganizationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrganizationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrganizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CreateOrganizationDto', () => {
    it('should include all new required fields', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'company',
        status: 'active',
        country: 'VN',
      };

      expect(dto.type).toBe('company');
      expect(dto.status).toBe('active');
      expect(dto.country).toBe('VN');
    });

    it('should accept all organization types', () => {
      const types: OrganizationType[] = [
        'holding',
        'company',
        'joint-venture',
        'partner',
        'branch',
      ];

      types.forEach((type) => {
        const dto: CreateOrganizationDto = {
          taxId: '1234567890',
          name: 'Test Company',
          internationalName: 'Test Company Ltd',
          headquartersAddress: '123 Test Street',
          legalRepresentative: 'John Doe',
          contactPhone: '0901234567',
          contactEmail: 'test@example.com',
          foundedDate: new Date().toISOString(),
          type: type,
          status: 'active',
          country: 'VN',
        };

        expect(dto.type).toBe(type);
      });
    });

    it('should accept all organization statuses', () => {
      const statuses: OrganizationStatus[] = ['active', 'inactive', 'pending'];

      statuses.forEach((status) => {
        const dto: CreateOrganizationDto = {
          taxId: '1234567890',
          name: 'Test Company',
          internationalName: 'Test Company Ltd',
          headquartersAddress: '123 Test Street',
          legalRepresentative: 'John Doe',
          contactPhone: '0901234567',
          contactEmail: 'test@example.com',
          foundedDate: new Date().toISOString(),
          type: 'company',
          status: status,
          country: 'VN',
        };

        expect(dto.status).toBe(status);
      });
    });

    it('should accept optional description and website fields', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'company',
        status: 'active',
        country: 'VN',
        description: 'This is a test description',
        website: 'https://example.com',
      };

      expect(dto.description).toBe('This is a test description');
      expect(dto.website).toBe('https://example.com');
    });

    it('should work without optional fields', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'company',
        status: 'active',
        country: 'VN',
      };

      expect(dto.description).toBeUndefined();
      expect(dto.website).toBeUndefined();
    });
  });

  describe('createOrganization with new fields', () => {
    it('should send POST request with new fields', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'holding',
        status: 'active',
        country: 'VN',
        description: 'A test holding company',
        website: 'https://test.com',
      };

      service.createOrganization(dto).subscribe();

      const req = httpMock.expectOne((request) => request.url.includes('/organizations'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.type).toBe('holding');
      expect(req.request.body.status).toBe('active');
      expect(req.request.body.country).toBe('VN');
      expect(req.request.body.description).toBe('A test holding company');
      expect(req.request.body.website).toBe('https://test.com');

      req.flush({
        id: '123',
        ...dto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  });

  describe('API Envelope Support', () => {
    it('should handle new API envelope format for createOrganization', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'company',
        status: 'active',
        country: 'VN',
      };

      const mockOrg = {
        id: '123',
        ...dto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const apiResponse = wrapSuccess(
        {
          mode: 'create' as const,
          item: mockOrg,
        },
        'Organization created successfully',
      );

      service.createOrganization(dto).subscribe((response) => {
        expect(response.id).toBe('123');
        expect(response.name).toBe('Test Company');
      });

      const req = httpMock.expectOne((request) => request.url.includes('/organizations'));
      expect(req.request.method).toBe('POST');
      req.flush(apiResponse);
    });

    it('should handle new API envelope format for getOrganization', () => {
      const mockOrg = {
        id: '123',
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'company' as OrganizationType,
        status: 'active' as OrganizationStatus,
        country: 'VN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const apiResponse = wrapSuccess({
        mode: 'get' as const,
        item: mockOrg,
      });

      service.getOrganization('123').subscribe((response) => {
        expect(response.id).toBe('123');
        expect(response.name).toBe('Test Company');
      });

      const req = httpMock.expectOne((request) => request.url.includes('/organizations/123'));
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });

    it('should handle new API envelope format for getUserOrganizations', () => {
      const mockOrgs = [
        {
          id: '1',
          taxId: '1234567890',
          name: 'Company 1',
          internationalName: 'Company 1 Ltd',
          headquartersAddress: '123 Street',
          legalRepresentative: 'John Doe',
          contactPhone: '0901234567',
          contactEmail: 'test@example.com',
          foundedDate: new Date().toISOString(),
          type: 'company' as OrganizationType,
          status: 'active' as OrganizationStatus,
          country: 'VN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const apiResponse = wrapSuccess(mockOrgs, 'Organizations retrieved successfully');

      service.getUserOrganizations().subscribe((response) => {
        expect(response).toHaveLength(1);
        expect(response[0].id).toBe('1');
      });

      const req = httpMock.expectOne((request) => request.url.includes('/v1/organizations'));
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });
  });
});
