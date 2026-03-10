import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';
import {
  OrganizationInvitation,
  OrganizationService,
} from '../../../../../core/services/organization-service';

export interface InvitesResolvedData {
  data: OrganizationInvitation[];
  total: number;
}

export const InvitesResolver: ResolveFn<
  InvitesResolvedData | null
> = (): Observable<InvitesResolvedData | null> => {
  const contextService = inject(OrganizationContextService);
  const orgService = inject(OrganizationService);

  const orgId = contextService.currentOrganization()?.id;
  if (!orgId) return of(null);

  return orgService
    .getOrganizationInvitations(orgId, { page: 1, limit: 20 })
    .pipe(catchError(() => of(null)));
};
