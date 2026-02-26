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
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MultiSelectModule } from 'primeng/multiselect';
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
import { UserDatePipe } from '../../../../../../core/pipes/user-date.pipe';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

/**
 * Column definition interface
 */
interface ColumnDef {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
}

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
    MpToolbar,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    TagModule,
    MultiSelectModule,
    PaginationComponent,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
    UserDatePipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTypeList implements OnInit, OnDestroy {
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
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  // Column definitions
  protected readonly columnOptions: ColumnDef[] = [
    { field: 'code', header: 'productTypeList.table.code', sortable: true, width: '150px' },
    { field: 'name', header: 'productTypeList.table.name', sortable: true },
    { field: 'description', header: 'productTypeList.table.description', sortable: false },
    { field: 'isActive', header: 'productTypeList.table.status', sortable: true, width: '100px' },
    {
      field: 'createdAt',
      header: 'productTypeList.table.createdAt',
      sortable: true,
      width: '180px',
    },
  ];
  protected selectedColumns: ColumnDef[] = [...this.columnOptions];

  // State signals
  protected readonly productTypes = signal<ProductType[]>([]);
  protected selectedProductTypes: ProductType[] = []; // For PrimeNG table binding
  protected readonly selectedProductType = signal<ProductType | null>(null);
  protected contextMenuSelectedProductType: ProductType | null = null; // For context menu selection
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);
  protected readonly sortField = signal<string>('name');
  protected readonly sortOrder = signal<number>(1); // 1 = ascending, -1 = descending

  // Current row menu items - to fix double-click issue
  protected currentRowMenuItems: MenuItem[] = [];

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly hasSelectedItems = computed(() => this.selectedProductTypes.length > 0);

  // Pre-populated action menu items to fix click issue
  protected currentActionMenuItems: MenuItem[] = [];

  // Build action menu items dynamically
  private buildActionMenuItems(): MenuItem[] {
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

  /**
   * Show action menu - populate items before showing to fix click issue
   */
  protected onShowActionMenu(event: MouseEvent, menu: Menu): void {
    this.currentActionMenuItems = this.buildActionMenuItems();
    menu.toggle(event);
  }

  // Pre-populated context menu items to fix click issue
  protected currentContextMenuItems: MenuItem[] = [];

  // Build context menu items for a product type
  private buildContextMenuItems(productType: ProductType): MenuItem[] {
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

  /**
   * Handle context menu selection change - update menu items when selection changes
   */
  protected onContextMenuSelectionChange(productType: ProductType | null): void {
    this.contextMenuSelectedProductType = productType;
    if (productType) {
      this.currentContextMenuItems = this.buildContextMenuItems(productType);
    }
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
          this.productTypeService.deleteProductType(pt.id).subscribe({
            next: () => {
              completed++;
              if (completed + errors === selected.length) {
                this.messageService.add({
                  severity: errors > 0 ? 'warn' : 'success',
                  summary: this.translocoService.translate('productTypeList.messages.success'),
                  detail: this.translocoService.translate(
                    'productTypeList.messages.bulkDeleteSuccess',
                    {
                      count: completed,
                    },
                  ),
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
                  detail: this.translocoService.translate(
                    'productTypeList.messages.bulkDeleteFailed',
                  ),
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
   * View product type details
   */
  protected onViewProductType(productType: ProductType): void {
    this.router.navigate([productType.id], { relativeTo: this.route });
  }

  /**
   * Edit product type
   */
  protected onEditProductType(productType: ProductType): void {
    this.router.navigate([productType.id, 'edit'], { relativeTo: this.route });
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
        this.productTypeService.deleteProductType(productType.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('productTypeList.messages.success'),
              detail: this.translocoService.translate('productTypeList.messages.deleteSuccess', {
                name: productType.name,
              }),
            });
            if (this.selectedProductType()?.id === productType.id) {
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
        sort: { [this.sortField()]: this.sortOrder() as 1 | -1 },
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

  /**
   * Handle lazy load event from table paginator
   */
  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows && event.rows > 0 ? event.rows : PAGE_SIZE_OPTIONS[0];
    const page = event.first !== undefined ? Math.floor(event.first / rows) + 1 : 1;
    const pageSize = rows;
    const search = this.searchQuery() || '-';

    // Handle sorting from lazy load event
    if (event.sortField) {
      this.sortField.set(event.sortField as string);
      this.sortOrder.set(event.sortOrder || 1);
      // Refresh data with new sort
      this.onRefresh();
    }

    // Only navigate if page or pageSize changed
    if (page !== this.currentPage() || pageSize !== this.pageSize()) {
      this.router.navigate(['../../..', search, page, pageSize], {
        relativeTo: this.route,
      });
    }
  }

  /**
   * Show row menu - fixes double-click issue by setting menu items before showing
   */
  protected onShowRowMenu(event: MouseEvent, productType: ProductType, menu: Menu): void {
    event.stopPropagation();
    this.currentRowMenuItems = this.getRowMenuItems(productType);
    menu.toggle(event);
  }
}
