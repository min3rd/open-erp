import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';
import { OrganizationService } from '../../../../../core/services/organization-service';
import { InvitesResolver } from './invites.resolver';

const mockInvitesResponse = {
  data: [
    {
      id: 'invite-1',
      organizationId: 'org-1',
      inviteeEmail: 'new@test.com',
      roles: ['member'],
      status: 'pending' as const,
      expiresAt: '2025-12-31T00:00:00Z',
      invitedBy: 'admin@test.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
};

describe('InvitesResolver', () => {
  let contextService: jasmine.SpyObj<OrganizationContextService>;
  let orgService: jasmine.SpyObj<OrganizationService>;

  beforeEach(() => {
    contextService = jasmine.createSpyObj('OrganizationContextService', ['currentOrganization'], {
      currentOrganization: () => ({ id: 'org-1', name: 'Test Org', internationalName: 'Test Org Ltd', taxId: '1234567890' }),
    });
    orgService = jasmine.createSpyObj('OrganizationService', ['getOrganizationInvitations']);

    TestBed.configureTestingModule({
      providers: [
        { provide: OrganizationContextService, useValue: contextService },
        { provide: OrganizationService, useValue: orgService },
      ],
    });
  });

  it('should return invitations data on success', (done) => {
    orgService.getOrganizationInvitations.and.returnValue(of(mockInvitesResponse));

    const result = TestBed.runInInjectionContext(() =>
      InvitesResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof InvitesResolver>;

    (result as any).subscribe((data: any) => {
      expect(data).toEqual(mockInvitesResponse);
      expect(orgService.getOrganizationInvitations).toHaveBeenCalledWith('org-1', {
        page: 1,
        limit: 20,
      });
      done();
    });
  });

  it('should return null when org service fails', (done) => {
    orgService.getOrganizationInvitations.and.returnValue(
      throwError(() => new Error('Forbidden')),
    );

    const result = TestBed.runInInjectionContext(() =>
      InvitesResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof InvitesResolver>;

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
      InvitesResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as ReturnType<typeof InvitesResolver>;

    (result as any).subscribe((data: any) => {
      expect(data).toBeNull();
      expect(orgService.getOrganizationInvitations).not.toHaveBeenCalled();
      done();
    });
  });
});
