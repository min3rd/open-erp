import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';
import { OrganizationService } from '../../../../../core/services/organization-service';
import { MembersResolver } from './members.resolver';

const mockMembersResponse = {
  data: [
    {
      id: 'member-1',
      userId: 'user-1',
      username: 'jdoe',
      email: 'jdoe@test.com',
      fullName: 'John Doe',
      name: 'John Doe',
      role: 'member',
      roles: ['member'],
      status: 'active' as const,
      joinedAt: '2024-01-01T00:00:00Z',
      departments: [],
      positions: [],
      assignments: [],
      isPrimaryOwner: false,
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

describe('MembersResolver', () => {
  let contextService: jasmine.SpyObj<OrganizationContextService>;
  let orgService: jasmine.SpyObj<OrganizationService>;

  beforeEach(() => {
    contextService = jasmine.createSpyObj('OrganizationContextService', ['currentOrganization'], {
      currentOrganization: () => ({ id: 'org-1', name: 'Test Org', internationalName: 'Test Org Ltd', taxId: '1234567890' }),
    });
    orgService = jasmine.createSpyObj('OrganizationService', ['getOrganizationMembers']);

    TestBed.configureTestingModule({
      providers: [
        { provide: OrganizationContextService, useValue: contextService },
        { provide: OrganizationService, useValue: orgService },
      ],
    });
  });

  it('should return members data on success', (done) => {
    orgService.getOrganizationMembers.and.returnValue(of(mockMembersResponse));

    const result = TestBed.runInInjectionContext(() =>
      MembersResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof MembersResolver>;

    (result as any).subscribe((data: any) => {
      expect(data).toEqual({ items: mockMembersResponse.data, total: 1 });
      expect(orgService.getOrganizationMembers).toHaveBeenCalledWith('org-1', 1, 20);
      done();
    });
  });

  it('should return null when org service fails', (done) => {
    orgService.getOrganizationMembers.and.returnValue(throwError(() => new Error('Forbidden')));

    const result = TestBed.runInInjectionContext(() =>
      MembersResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof MembersResolver>;

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
      MembersResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof MembersResolver>;

    (result as any).subscribe((data: any) => {
      expect(data).toBeNull();
      expect(orgService.getOrganizationMembers).not.toHaveBeenCalled();
      done();
    });
  });

  it('should handle response with items property instead of data', (done) => {
    const responseWithItems = { items: mockMembersResponse.data, data: [], total: 1, page: 1, limit: 20 };
    orgService.getOrganizationMembers.and.returnValue(of(responseWithItems));

    const result = TestBed.runInInjectionContext(() =>
      MembersResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof MembersResolver>;

    (result as any).subscribe((data: any) => {
      expect(data).not.toBeNull();
      expect(data.total).toBe(1);
      done();
    });
  });
});
