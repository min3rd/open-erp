import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';

// Services and types
import { Product } from '../../../../../../../core/services/product/product.service';
import { ProductDetailStateService } from '../product-detail-state.service';

@Component({
  selector: 'product-tab-dimensions',
  imports: [CommonModule, TranslocoModule],
  template: `
    <div class="product-tab-dimensions" *transloco="let t">
      <div class="bg-surface-0 rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-surface-900 mb-4">{{ t('productDetail.tabs.dimensions') }}</h2>
        <p class="text-surface-600">{{ t('productDetail.dimensions.description') }}</p>
        
        <div class="mt-6">
          <p class="text-sm text-surface-500">{{ t('productDetail.dimensions.notAvailable') }}</p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabDimensions implements OnInit, OnDestroy {
  private productDetailState = inject(ProductDetailStateService);
  private destroy$ = new Subject<void>();

  protected readonly product = this.productDetailState.product;

  ngOnInit(): void {
    // Product data is provided by parent detail component via service
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
