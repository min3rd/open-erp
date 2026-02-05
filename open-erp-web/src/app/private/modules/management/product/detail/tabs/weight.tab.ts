import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// Services and types
import { Product } from '../../../../../../core/services/product/product.service';

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
