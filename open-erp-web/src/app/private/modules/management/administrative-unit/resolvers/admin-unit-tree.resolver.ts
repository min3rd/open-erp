import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AdministrativeUnitService } from '../services/administrative-unit.service';
import { AdminUnitTreeResponse } from '../administrative-unit.types';

export const adminUnitTreeResolver: ResolveFn<AdminUnitTreeResponse> = (
  route: ActivatedRouteSnapshot,
): Observable<AdminUnitTreeResponse> => {
  const service = inject(AdministrativeUnitService);

  const filter = route.paramMap.get('filter') || 'all';
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '100', 10);

  return service.getTreeData({
    filter,
    page,
    limit,
  });
};
