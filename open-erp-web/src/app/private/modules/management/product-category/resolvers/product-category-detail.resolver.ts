import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ProductCategoryService } from '../../../../../../core/services/product-category/product-category.service';
import { ProductCategory } from '../product-category.types';

/**
 * Resolver for product category detail
 * Fetches a single product category by ID from route params
 */
export const productCategoryDetailResolver: ResolveFn<ProductCategory | null> = (
  route: ActivatedRouteSnapshot
) => {
  const service = inject(ProductCategoryService);
  const router = inject(Router);
  
  const id = route.paramMap.get('id');
  
  if (!id) {
    return of(null);
  }
  
  return service.getProductCategoryById(id).pipe(
    catchError((error) => {
      console.error('Error fetching product category:', error);
      // Navigate back to list if category not found
      router.navigate(['../'], { relativeTo: route });
      return of(null);
    })
  );
};
