import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';
import {
  OrganizationMember,
  OrganizationService,
} from '../../../../../core/services/organization-service';

export interface MembersResolvedData {
  items: OrganizationMember[];
  total: number;
}

export const MembersResolver: ResolveFn<
  MembersResolvedData | null
> = (): Observable<MembersResolvedData | null> => {
  const contextService = inject(OrganizationContextService);
  const orgService = inject(OrganizationService);

  const orgId = contextService.currentOrganization()?.id;
  if (!orgId) return of(null);

  return orgService.getOrganizationMembers(orgId, 1, 20).pipe(
    map((response) => ({
      items: response.data ?? response.items ?? [],
      total: response.total,
    })),
    catchError(() => of(null)),
  );
};
