import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';

// Services and types
import { Product } from '../../../../../../../core/services/product/product.service';
import { ProductDetailStateService } from '../product-detail-state.service';

@Component({
  selector: 'product-tab-media',
  imports: [CommonModule, TranslocoModule],
  template: `
    <div class="product-tab-media" *transloco="let t">
      <div class="bg-surface-0 rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-surface-900 mb-4">{{ t('productDetail.tabs.media') }}</h2>
        <p class="text-surface-600">{{ t('productDetail.media.description') }}</p>
        
        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Placeholder for media items -->
          <div class="aspect-square bg-surface-100 border-2 border-dashed border-surface-300 rounded-lg flex items-center justify-center">
            <i class="pi pi-image text-4xl text-surface-400"></i>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabMedia implements OnInit, OnDestroy {
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
