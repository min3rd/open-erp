import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DrawerModule } from 'primeng/drawer';
import { TabsModule } from 'primeng/tabs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Services and types
import {
  ProductService,
  Product,
  ProductStatus,
} from '../../../../../../core/services/product/product.service';
import { ProductDetailStateService } from './product-detail-state.service';

/**
 * Tab definition interface
 */
interface TabDef {
  id: string;
  label: string;
  icon?: string;
  route: string;
}

@Component({
  selector: 'management-product-detail',
  imports: [
    CommonModule,
    RouterOutlet,
    TranslocoModule,
    ButtonModule,
    TooltipModule,
    TagModule,
    DrawerModule,
    TabsModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService, ProductDetailStateService],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private productDetailState = inject(ProductDetailStateService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // Constants
  protected readonly ProductStatus = ProductStatus;

  // Tab definitions
  protected readonly tabs: TabDef[] = [
    {
      id: 'general',
      label: 'productDetail.tabs.general',
      icon: 'pi pi-info-circle',
      route: 'general',
    },
    { id: 'media', label: 'productDetail.tabs.media', icon: 'pi pi-images', route: 'media' },
    { id: 'weight', label: 'productDetail.tabs.weight', icon: 'pi pi-box', route: 'weight' },
    {
      id: 'dimensions',
      label: 'productDetail.tabs.dimensions',
      icon: 'pi pi-arrows-alt',
      route: 'dimensions',
    },
    { id: 'storage', label: 'productDetail.tabs.storage', icon: 'pi pi-cloud', route: 'storage' },
    {
      id: 'warehouse',
      label: 'productDetail.tabs.warehouse',
      icon: 'pi pi-building',
      route: 'warehouse',
    },
    { id: 'custom', label: 'productDetail.tabs.custom', icon: 'pi pi-cog', route: 'custom' },
  ];

  // State signals
  protected readonly product = signal<Product | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isVisible = signal(true);
  protected readonly activeTabId = signal<string>('general');
  protected activeTabIndex = 0;

  // Computed values
  protected readonly statusSeverity = computed(() => {
    const status = this.product()?.status;
    switch (status) {
      case ProductStatus.ACTIVE:
        return 'success';
      case ProductStatus.INACTIVE:
        return 'warn';
      case ProductStatus.DRAFT:
        return 'info';
      case ProductStatus.DISCONTINUED:
        return 'danger';
      default:
        return 'secondary';
    }
  });

  protected readonly canEdit = computed(() => {
    // TODO: Implement permission check
    return true;
  });

  protected readonly canDelete = computed(() => {
    // TODO: Implement permission check
    return true;
  });

  protected readonly canDeactivate = computed(() => {
    // TODO: Implement permission check
    const product = this.product();
    return product?.status === ProductStatus.ACTIVE;
  });

  ngOnInit(): void {
    // Load product from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['product']) {
        const product = data['product'];
        this.product.set(product);
        // Share product data with tabs via service
        this.productDetailState.setProduct(product);
      }
    });

    // Track active tab from route
    this.route.firstChild?.url.pipe(takeUntil(this.destroy$)).subscribe((segments) => {
      if (segments && segments.length > 0) {
        const tabId = segments[0].path;
        this.activeTabId.set(tabId);
        // Update tab index
        const index = this.tabs.findIndex((t) => t.id === tabId);
        if (index >= 0) {
          this.activeTabIndex = index;
        }
      } else {
        this.activeTabId.set('general');
        this.activeTabIndex = 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.productDetailState.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle tab change
   */
  protected onTabChange(index: number | string | undefined): void {
    const tabIndex = typeof index === 'number' ? index : 0;
    if (tabIndex >= 0 && tabIndex < this.tabs.length) {
      const tab = this.tabs[tabIndex];
      this.router.navigate([tab.route], { relativeTo: this.route });
    }
  }

  /**
   * Close drawer and navigate back to product list
   */
  protected onClose(): void {
    this.isVisible.set(false);
    // Navigate back to list (2 levels up: view -> sku)
    this.router.navigate(['../..'], { relativeTo: this.route });
  }

  /**
   * Copy SKU to clipboard
   */
  protected onCopySku(): void {
    const sku = this.product()?.sku;
    if (sku && navigator.clipboard) {
      navigator.clipboard
        .writeText(sku)
        .then(() => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('productDetail.actions.copySku.success'),
            detail: this.translocoService.translate('productDetail.actions.copySku.successDetail', {
              sku,
            }),
          });
        })
        .catch(() => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('productDetail.actions.copySku.error'),
          });
        });
    }
  }

  /**
   * Share product (placeholder)
   */
  protected onShare(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('productDetail.actions.share.info'),
    });
  }

  /**
   * Toggle favorite (placeholder)
   */
  protected onToggleFavorite(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('productDetail.actions.favorite.info'),
    });
  }

  /**
   * Navigate to edit view
   */
  protected onEdit(): void {
    const product = this.product();
    if (product) {
      // Navigate to edit route (sibling to view)
      this.router.navigate(['../edit'], { relativeTo: this.route });
    }
  }

  /**
   * Deactivate product
   */
  protected onDeactivate(): void {
    const product = this.product();
    if (!product) return;

    this.confirmationService.confirm({
      header: this.translocoService.translate('productDetail.actions.deactivate.confirmTitle'),
      message: this.translocoService.translate('productDetail.actions.deactivate.confirmMessage', {
        name: product.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.isLoading.set(true);
        this.productService
          .updateProduct(product.id, { status: ProductStatus.INACTIVE })
          .subscribe({
            next: (updated) => {
              this.product.set(updated);
              this.productDetailState.setProduct(updated);
              this.isLoading.set(false);
              this.messageService.add({
                severity: 'success',
                summary: this.translocoService.translate(
                  'productDetail.actions.deactivate.success',
                ),
                detail: this.translocoService.translate(
                  'productDetail.actions.deactivate.successDetail',
                  {
                    name: product.name,
                  },
                ),
              });
            },
            error: (error) => {
              this.isLoading.set(false);
              this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('productDetail.actions.deactivate.error'),
                detail:
                  error.message ||
                  this.translocoService.translate('productDetail.actions.deactivate.errorDetail'),
              });
            },
          });
      },
    });
  }

  /**
   * Delete product
   */
  protected onDelete(): void {
    const product = this.product();
    if (!product) return;

    this.confirmationService.confirm({
      header: this.translocoService.translate('productDetail.actions.delete.confirmTitle'),
      message: this.translocoService.translate('productDetail.actions.delete.confirmMessage', {
        name: product.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isLoading.set(true);
        this.productService.deleteProduct(product.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('productDetail.actions.delete.success'),
              detail: this.translocoService.translate(
                'productDetail.actions.delete.successDetail',
                {
                  name: product.name,
                },
              ),
            });
            // Close drawer and navigate back to list
            this.onClose();
          },
          error: (error) => {
            this.isLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('productDetail.actions.delete.error'),
              detail:
                error.message ||
                this.translocoService.translate('productDetail.actions.delete.errorDetail'),
            });
          },
        });
      },
    });
  }
}
