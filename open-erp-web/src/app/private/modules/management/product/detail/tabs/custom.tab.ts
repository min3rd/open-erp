import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { DividerModule } from 'primeng/divider';

// Services and types
import { Product } from '../../../../../../core/services/product/product.service';

@Component({
  selector: 'product-tab-custom',
  imports: [CommonModule, TranslocoModule, DividerModule],
  template: `
    <div class="product-tab-custom" *transloco="let t">
      <div class="bg-surface-0 rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-surface-900 mb-4">{{ t('productDetail.tabs.custom') }}</h2>
        <p class="text-surface-600">{{ t('productDetail.custom.description') }}</p>
        
        <div class="mt-6" *ngIf="product()?.metadata">
          <h3 class="text-lg font-medium text-surface-800 mb-3">{{ t('productDetail.custom.metadata') }}</h3>
          
          <div class="space-y-2" *ngIf="hasMetadata()">
            <div *ngFor="let entry of metadataEntries()" class="field">
              <label class="block text-sm font-medium text-surface-600 mb-1">{{ entry.key }}</label>
              <div class="text-surface-900">{{ entry.value }}</div>
            </div>
          </div>
          
          <p *ngIf="!hasMetadata()" class="text-sm text-surface-500">{{ t('productDetail.custom.noMetadata') }}</p>
        </div>
        
        <div class="mt-6" *ngIf="!product()?.metadata">
          <p class="text-sm text-surface-500">{{ t('productDetail.custom.notAvailable') }}</p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabCustom implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  protected readonly product = signal<Product | null>(null);
  protected readonly metadataEntries = signal<{ key: string; value: any }[]>([]);
  protected readonly hasMetadata = signal(false);

  ngOnInit(): void {
    this.route.parent?.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['product']) {
        const product = data['product'];
        this.product.set(product);
        
        if (product.metadata) {
          const entries = Object.entries(product.metadata).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : value,
          }));
          this.metadataEntries.set(entries);
          this.hasMetadata.set(entries.length > 0);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
