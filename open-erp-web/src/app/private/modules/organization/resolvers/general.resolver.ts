import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';
import {
  OrganizationResponse,
  OrganizationService,
} from '../../../../../core/services/organization-service';

export const GeneralResolver: ResolveFn<
  OrganizationResponse | null
> = (): Observable<OrganizationResponse | null> => {
  const contextService = inject(OrganizationContextService);
  const orgService = inject(OrganizationService);

  const orgId = contextService.currentOrganization()?.id;
  if (!orgId) return of(null);

  return orgService.getOrganization(orgId).pipe(catchError(() => of(null)));
};
