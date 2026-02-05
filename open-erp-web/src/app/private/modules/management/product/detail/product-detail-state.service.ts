import { Injectable, signal } from '@angular/core';
import { Product } from '../../../../../../core/services/product/product.service';

/**
 * Service to share product data between detail component and tabs
 * Avoids fragile parent.parent.data access pattern
 */
@Injectable()
export class ProductDetailStateService {
  private readonly productSignal = signal<Product | null>(null);

  /**
   * Get the current product signal (read-only)
   */
  get product() {
    return this.productSignal.asReadonly();
  }

  /**
   * Set the current product
   */
  setProduct(product: Product | null): void {
    this.productSignal.set(product);
  }

  /**
   * Clear the product data
   */
  clear(): void {
    this.productSignal.set(null);
  }
}
