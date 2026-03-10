import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';

// PrimeNG imports
import { DividerModule } from 'primeng/divider';

// Services and types
import { Product } from '../../../../../../../core/services/product/product.service';
import { ProductDetailStateService } from '../product-detail-state.service';

@Component({
  selector: 'product-tab-custom',
  imports: [CommonModule, TranslocoModule, DividerModule],
  templateUrl: './custom.tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabCustom implements OnInit, OnDestroy {
  private productDetailState = inject(ProductDetailStateService);
  private destroy$ = new Subject<void>();

  protected readonly product = this.productDetailState.product;
  protected readonly metadataEntries = signal<{ key: string; value: any }[]>([]);
  protected readonly hasMetadata = signal(false);

  ngOnInit(): void {
    // Watch for product changes and update metadata
    const productData = this.product();
    if (productData?.metadata) {
      const entries = Object.entries(productData.metadata).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : value,
      }));
      this.metadataEntries.set(entries);
      this.hasMetadata.set(entries.length > 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
