import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// Services and types
import { Product } from '../../../../../../core/services/product/product.service';

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
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  protected readonly product = signal<Product | null>(null);

  ngOnInit(): void {
    this.route.parent?.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['product']) {
        this.product.set(data['product']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
