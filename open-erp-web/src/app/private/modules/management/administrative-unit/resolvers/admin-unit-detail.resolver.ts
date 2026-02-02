import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AdministrativeUnitService } from '../services/administrative-unit.service';
import { AdministrativeUnit, AdminUnitType } from '../administrative-unit.types';

export const adminUnitDetailResolver: ResolveFn<AdministrativeUnit> = (
  route: ActivatedRouteSnapshot
): Observable<AdministrativeUnit> => {
  const service = inject(AdministrativeUnitService);

  const code = route.paramMap.get('code')!;
  const type = route.paramMap.get('type') as AdminUnitType;

  return service.getUnit(code, type);
};
