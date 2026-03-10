import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  WarehouseService,
  ProvinceDto,
} from '../../../../../../core/services/warehouse/warehouse.service';

export const provincesResolver: ResolveFn<ProvinceDto[]> = (): Observable<ProvinceDto[]> => {
  const service = inject(WarehouseService);

  return service.getProvinces().pipe(
    catchError((error) => {
      console.error('Failed to load provinces:', error);
      return of([]);
    }),
  );
};
