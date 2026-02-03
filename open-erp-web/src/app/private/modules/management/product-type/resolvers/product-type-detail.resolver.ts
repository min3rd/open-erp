import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { ProductTypeService, ProductType } from '../../../../../../core/services/product-type/product-type.service';

/**
 * Resolver for product type detail
 * Pre-fetches a single product type before route activation
 */
export const productTypeDetailResolver: ResolveFn<ProductType | null> = (
  route: ActivatedRouteSnapshot
) => {
  const productTypeService = inject(ProductTypeService);
  const id = route.paramMap.get('id');

  if (!id) {
    return null;
  }

  return productTypeService.getProductTypeById(id);
};
