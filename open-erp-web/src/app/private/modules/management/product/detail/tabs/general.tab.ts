import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { DividerModule } from 'primeng/divider';

// Services and types
import { Product } from '../../../../../../../core/services/product/product.service';
import { ProductDetailStateService } from '../product-detail-state.service';
import { UserDatePipe } from '../../../../../../../core/pipes/user-date.pipe';

@Component({
  selector: 'product-tab-general',
  imports: [CommonModule, TranslocoModule, DividerModule, UserDatePipe],
  templateUrl: './general.tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTabGeneral implements OnInit, OnDestroy {
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
