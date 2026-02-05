import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ProductService, Product } from '../../../../../../core/services/product/product.service';

/**
 * Resolver for product detail - loads product by SKU
 */
export const productDetailResolver: ResolveFn<Product | null> = (route) => {
  const productService = inject(ProductService);
  const router = inject(Router);
  const identifier = route.paramMap.get('sku');

  if (!identifier) {
    router.navigate(['/private/management/product']);
    return of(null);
  }

  // Try to fetch product by SKU
  return productService.getProductBySku(identifier).pipe(
    catchError((error) => {
      console.error('Failed to load product:', error);
      // Navigate back to list on error
      router.navigate(['/private/management/product']);
      return of(null);
    })
  );
};
