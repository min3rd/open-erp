import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ProductService, Product } from '../../../../../../core/services/product/product.service';

/**
 * Resolver for product detail - loads product by identifier (slug, SKU, or ID)
 * Resolution order: slug → sku → id
 */
export const productDetailResolver: ResolveFn<Product | null> = (route) => {
  const productService = inject(ProductService);
  const router = inject(Router);
  const identifier = route.paramMap.get('sku');
  if (!identifier) {
    router.navigate(['/modules/management/product']);
    return of(null);
  }

  // Try to fetch product by identifier (slug, SKU, or ID)
  return productService.getProductBySku(identifier).pipe(
    catchError((error) => {
      console.error('Failed to load product:', error);
      // Navigate back to list on error
      router.navigate(['/modules/management/product']);
      return of(null);
    })
  );
};
