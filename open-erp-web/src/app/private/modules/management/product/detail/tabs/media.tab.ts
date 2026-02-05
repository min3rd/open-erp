import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// Services and types
import { Product } from '../../../../../../core/services/product/product.service';

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
