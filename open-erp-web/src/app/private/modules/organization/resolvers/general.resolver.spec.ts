import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';
import { OrganizationService } from '../../../../../core/services/organization-service';
import { GeneralResolver } from './general.resolver';

const mockOrg = {
  id: 'org-1',
  name: 'Test Org',
  taxId: '1234567890',
  internationalName: 'Test Org Ltd',
  headquartersAddress: '123 Test St',
  legalRepresentative: 'John Doe',
  contactPhone: '0901234567',
  contactEmail: 'org@test.com',
  foundedDate: '2020-01-01',
  type: 'company' as const,
  status: 'active' as const,
  country: 'VN',
  createdAt: '2020-01-01T00:00:00Z',
  updatedAt: '2020-01-01T00:00:00Z',
};

describe('GeneralResolver', () => {
  let contextService: jasmine.SpyObj<OrganizationContextService>;
  let orgService: jasmine.SpyObj<OrganizationService>;

  beforeEach(() => {
    contextService = jasmine.createSpyObj('OrganizationContextService', ['currentOrganization'], {
      currentOrganization: () => ({
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org Ltd',
        taxId: '1234567890',
      }),
    });
    orgService = jasmine.createSpyObj('OrganizationService', ['getOrganization']);

    TestBed.configureTestingModule({
      providers: [
        { provide: OrganizationContextService, useValue: contextService },
        { provide: OrganizationService, useValue: orgService },
      ],
    });
  });

  it('should return organization data on success', (done) => {
    orgService.getOrganization.and.returnValue(of(mockOrg));

    const result = TestBed.runInInjectionContext(() =>
      GeneralResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof GeneralResolver>;

    (result as any).subscribe((data: any) => {
      expect(data).toEqual(mockOrg);
      expect(orgService.getOrganization).toHaveBeenCalledWith('org-1');
      done();
    });
  });

  it('should return null when org service fails', (done) => {
    orgService.getOrganization.and.returnValue(throwError(() => new Error('Not Found')));

    const result = TestBed.runInInjectionContext(() =>
      GeneralResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof GeneralResolver>;

    (result as any).subscribe((data: any) => {
      expect(data).toBeNull();
      done();
    });
  });

  it('should return null when no organization is selected', (done) => {
    const noOrgContextService = jasmine.createSpyObj(
      'OrganizationContextService',
      ['currentOrganization'],
      { currentOrganization: () => null },
    );

    TestBed.overrideProvider(OrganizationContextService, {
      useValue: noOrgContextService,
    });

    const result = TestBed.runInInjectionContext(() =>
      GeneralResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof GeneralResolver>;

    (result as any).subscribe((data: any) => {
      expect(data).toBeNull();
      expect(orgService.getOrganization).not.toHaveBeenCalled();
      done();
    });
  });
});
