import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ContextMenu } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constant';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Core components
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';

// Services
import {
  ProductTypeService,
  ProductType,
} from '../../../../../../core/services/product-type/product-type.service';

@Component({
  selector: 'management-product-type-list',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    TagModule,
    PaginationComponent,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTypeList implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productTypeService = inject(ProductTypeService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;

  // State signals
  protected readonly productTypes = signal<ProductType[]>([]);
  protected selectedProductTypes: ProductType[] = []; // For PrimeNG table binding
  protected readonly selectedProductType = signal<ProductType | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly hasSelectedItems = computed(() => this.selectedProductTypes.length > 0);

  // Actions menu items
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('productTypeList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productTypeList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productTypeList.actions.deleteSelected'),
        icon: 'pi pi-trash',
        disabled: this.selectedProductTypes.length === 0,
        command: () => this.onBulkDelete(),
      },
    ];
  }

  // Context menu items for row actions
  protected get contextMenuItems(): MenuItem[] {
    const productType = this.selectedProductType();
    if (!productType) return [];

    return [
      {
        label: this.translocoService.translate('productTypeList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewProductType(productType),
      },
      {
        label: this.translocoService.translate('productTypeList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditProductType(productType),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productTypeList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteProductType(productType),
      },
    ];
  }

  constructor() {
    // Detect mobile viewport
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }

    // Focus mobile search input when it opens
    effect(() => {
      if (this.isSearchOpen() && this.mobileSearchInput) {
        setTimeout(() => {
          this.mobileSearchInput?.nativeElement?.focus();
        }, this.SEARCH_FOCUS_DELAY);
      }
    });
  }

  ngOnInit(): void {
    // Load data from resolver if available
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const productTypeListData = data['productTypeList'];
      if (productTypeListData) {
        this.productTypes.set(productTypeListData.items);
        this.totalRecords.set(productTypeListData.total);
        this.isLoading.set(false);
      }
    });

    // Subscribe to route params for pagination and filters
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const search = params['search'] || '';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.searchQuery.set(search === '-' ? '' : search);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Handle search input changes
   */
  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchValue = input.value || '-';
    this.router.navigate(['../../..', searchValue, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: { page: number; pageSize: number }): void {
    const newPage = event.page;
    const newPageSize = event.pageSize;
    const search = this.searchQuery() || '-';

    this.router.navigate(['../../..', search, newPage, newPageSize], {
      relativeTo: this.route,
    });
  }

  /**
   * Navigate to add new product type
   */
  protected onAddProductType(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Export product types to CSV
   */
  protected onExportCSV(): void {
    this.productTypeService.exportCSV(this.productTypes());
    this.messageService.add({
      severity: 'success',
      summary: this.translocoService.translate('productTypeList.messages.success'),
      detail: this.translocoService.translate('productTypeList.messages.exportSuccess'),
    });
  }

  /**
   * Import product types
   */
  protected onImport(): void {
    this.fileInput?.nativeElement?.click();
  }

  /**
   * Handle file selection for import
   */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.isLoading.set(true);
    this.productTypeService.importCSV(file).subscribe({
      next: (results) => {
        const successCount = results.filter((r) => r.success).length;
        const errorCount = results.filter((r) => !r.success).length;

        if (errorCount === 0) {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('productTypeList.messages.success'),
            detail: this.translocoService.translate('productTypeList.messages.importSuccess', {
              count: successCount,
            }),
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: this.translocoService.translate('productTypeList.messages.warning'),
            detail: this.translocoService.translate('productTypeList.messages.importPartial', {
              success: successCount,
              error: errorCount,
            }),
          });
        }
        this.onRefresh();
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Import failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productTypeList.messages.error'),
          detail: this.translocoService.translate('productTypeList.messages.importFailed'),
        });
        this.isLoading.set(false);
      },
    });

    // Reset file input
    input.value = '';
  }

  /**
   * Bulk delete selected product types
   */
  protected onBulkDelete(): void {
    const selected = this.selectedProductTypes;
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      header: this.translocoService.translate('productTypeList.confirmBulkDelete.header'),
      message: this.translocoService.translate('productTypeList.confirmBulkDelete.message', {
        count: selected.length,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('productTypeList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('productTypeList.confirmDelete.reject'),
      accept: () => {
        // Delete one by one since backend doesn't have bulk delete
        let completed = 0;
        let errors = 0;
        selected.forEach((pt) => {
          this.productTypeService.deleteProductType(pt._id).subscribe({
            next: () => {
              completed++;
              if (completed + errors === selected.length) {
                this.messageService.add({
                  severity: errors > 0 ? 'warn' : 'success',
                  summary: this.translocoService.translate('productTypeList.messages.success'),
                  detail: this.translocoService.translate('productTypeList.messages.bulkDeleteSuccess', {
                    count: completed,
                  }),
                });
                this.selectedProductTypes = [];
                this.onRefresh();
              }
            },
            error: () => {
              errors++;
              if (completed + errors === selected.length) {
                this.messageService.add({
                  severity: 'error',
                  summary: this.translocoService.translate('productTypeList.messages.error'),
                  detail: this.translocoService.translate('productTypeList.messages.bulkDeleteFailed'),
                });
                this.onRefresh();
              }
            },
          });
        });
      },
    });
  }

  /**
   * Handle row click to select product type
   */
  protected onRowClick(productType: ProductType): void {
    this.selectedProductType.set(productType);
  }

  /**
   * Handle row right-click to show context menu
   */
  protected onRowRightClick(event: MouseEvent, productType: ProductType): void {
    event.preventDefault();
    this.selectedProductType.set(productType);
    this.contextMenu.show(event);
  }

  /**
   * View product type details
   */
  protected onViewProductType(productType: ProductType): void {
    this.router.navigate([productType._id], { relativeTo: this.route });
  }

  /**
   * Edit product type
   */
  protected onEditProductType(productType: ProductType): void {
    this.router.navigate([productType._id, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete a product type
   */
  protected onDeleteProductType(productType: ProductType): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('productTypeList.confirmDelete.header'),
      message: this.translocoService.translate('productTypeList.confirmDelete.message', {
        name: productType.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('productTypeList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('productTypeList.confirmDelete.reject'),
      accept: () => {
        this.productTypeService.deleteProductType(productType._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('productTypeList.messages.success'),
              detail: this.translocoService.translate('productTypeList.messages.deleteSuccess', {
                name: productType.name,
              }),
            });
            if (this.selectedProductType()?._id === productType._id) {
              this.selectedProductType.set(null);
            }
            this.onRefresh();
          },
          error: (error: any) => {
            console.error('Delete failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('productTypeList.messages.error'),
              detail: this.translocoService.translate('productTypeList.messages.deleteFailed'),
            });
          },
        });
      },
    });
  }

  /**
   * Check viewport size to detect mobile
   */
  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  /**
   * Toggle search input visibility on mobile
   */
  protected toggleSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
  }

  /**
   * Close search on mobile
   */
  protected closeSearch(): void {
    this.isSearchOpen.set(false);
    const search = '-';
    this.router.navigate(['../../..', search, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Refresh product type list
   */
  protected onRefresh(): void {
    this.isLoading.set(true);
    this.productTypeService
      .getProductTypes({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.productTypes.set(data.items);
          this.totalRecords.set(data.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Get per-row menu items for mobile list
   */
  protected getRowMenuItems(productType: ProductType): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('productTypeList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewProductType(productType),
      },
      {
        label: this.translocoService.translate('productTypeList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditProductType(productType),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productTypeList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteProductType(productType),
      },
    ];
  }
}
