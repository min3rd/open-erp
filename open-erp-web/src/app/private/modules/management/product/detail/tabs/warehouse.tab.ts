import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';

// Services and types
import { Product } from '../../../../../../../core/services/product/product.service';
import { ProductDetailStateService } from '../product-detail-state.service';

@Component({
  selector: 'product-tab-warehouse',
  imports: [CommonModule, TranslocoModule],
  templateUrl: './warehouse.tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabWarehouse implements OnInit, OnDestroy {
  private productDetailState = inject(ProductDetailStateService);
  private destroy$ = new Subject<void>();

  protected readonly product = this.productDetailState.product;

  protected readonly hasWarehouseData = computed(() => {
    const p = this.product();
    return (
      p != null &&
      (p.trackingType != null ||
        p.hazardLevel != null ||
        p.minStockLevel != null ||
        p.maxStockLevel != null ||
        p.reorderPoint != null ||
        p.reorderQuantity != null)
    );
  });

  ngOnInit(): void {
    // Product data is provided by parent detail component via service
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
