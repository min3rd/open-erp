import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';

// Services and types
import { Product } from '../../../../../../../core/services/product/product.service';
import { ProductDetailStateService } from '../product-detail-state.service';

@Component({
  selector: 'product-tab-weight',
  imports: [CommonModule, TranslocoModule],
  template: `
    <div class="product-tab-weight" *transloco="let t">
      <div class="bg-surface-0 rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-surface-900 mb-4">{{ t('productDetail.tabs.weight') }}</h2>
        <p class="text-surface-600">{{ t('productDetail.weight.description') }}</p>
        
        <div class="mt-6 space-y-4">
          <div class="field">
            <label class="block text-sm font-medium text-surface-600 mb-1">{{ t('productDetail.weight.unit') }}</label>
            <div class="text-surface-900">{{ product()?.unit || '-' }}</div>
          </div>
          <!-- Additional weight/expiry fields can be added here -->
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabWeight implements OnInit, OnDestroy {
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
