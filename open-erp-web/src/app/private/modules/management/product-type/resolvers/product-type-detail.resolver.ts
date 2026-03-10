import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ProductTypeService,
  ProductType,
} from '../../../../../../core/services/product-type/product-type.service';

export const productTypeDetailResolver: ResolveFn<ProductType | null> = (
  route: ActivatedRouteSnapshot,
): Observable<ProductType | null> => {
  const service = inject(ProductTypeService);
  const id = route.paramMap.get('id');

  if (!id) {
    return of(null);
  }

  return service.getProductTypeById(id).pipe(
    catchError((error: any) => {
      console.error('Failed to load product type:', error);
      return of(null);
    }),
  );
};
