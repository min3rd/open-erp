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
import { Menu } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constant';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Core components
import { PaginationComponent, PaginationChange } from '../../../../../../core/components/pagination/pagination';

// Services and types
import { ProductService, Product, ProductStatus } from '../../../../../../core/services/product/product.service';
import { ProductTypeService } from '../../../../../../core/services/product-type/product-type.service';
import { ProductCategoryService, ProductCategory } from '../../../../../../core/services/product-category/product-category.service';

/**
 * Column definition interface
 */
interface ColumnDef {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
}

/**
 * Filter option for status
 */
interface FilterOption {
  label: string;
  value: string;
}

/**
 * Sort option
 */
interface SortOption {
  label: string;
  field: string;
  order: number;
}

@Component({
  selector: 'management-product-list',
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
    MultiSelectModule,
    SelectModule,
    PaginationComponent,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductList implements OnInit, OnDestroy {
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private productTypeService = inject(ProductTypeService);
  private productCategoryService = inject(ProductCategoryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;
  protected readonly ProductStatus = ProductStatus;

  // Column definitions
  protected readonly columnOptions: ColumnDef[] = [
    { field: 'sku', header: 'productList.table.sku', sortable: true, width: '150px' },
    { field: 'name', header: 'productList.table.name', sortable: true },
    { field: 'type', header: 'productList.table.type', sortable: true, width: '150px' },
    { field: 'category', header: 'productList.table.category', sortable: false, width: '150px' },
    { field: 'unit', header: 'productList.table.unit', sortable: true, width: '100px' },
    { field: 'status', header: 'productList.table.status', sortable: true, width: '120px' },
    { field: 'barcode', header: 'productList.table.barcode', sortable: false, width: '150px' },
  ];
  protected selectedColumns: ColumnDef[] = [...this.columnOptions];

  // Filter options
  protected readonly statusFilterOptions: FilterOption[] = [
    { label: 'productList.filter.all', value: 'all' },
    { label: 'productList.filter.active', value: ProductStatus.ACTIVE },
    { label: 'productList.filter.inactive', value: ProductStatus.INACTIVE },
    { label: 'productList.filter.draft', value: ProductStatus.DRAFT },
    { label: 'productList.filter.discontinued', value: ProductStatus.DISCONTINUED },
  ];

  // Type and category filter options - loaded from API
  protected typeFilterOptions = signal<FilterOption[]>([{ label: 'productList.filter.allTypes', value: 'all' }]);
  protected categoryFilterOptions = signal<FilterOption[]>([{ label: 'productList.filter.allCategories', value: 'all' }]);

  // Sort options
  protected readonly sortOptions: SortOption[] = [
    { label: 'productList.sort.skuAsc', field: 'sku', order: 1 },
    { label: 'productList.sort.skuDesc', field: 'sku', order: -1 },
    { label: 'productList.sort.nameAsc', field: 'name', order: 1 },
    { label: 'productList.sort.nameDesc', field: 'name', order: -1 },
    { label: 'productList.sort.typeAsc', field: 'type', order: 1 },
    { label: 'productList.sort.typeDesc', field: 'type', order: -1 },
    { label: 'productList.sort.statusAsc', field: 'status', order: 1 },
    { label: 'productList.sort.statusDesc', field: 'status', order: -1 },
  ];

  // State signals
  protected readonly products = signal<Product[]>([]);
  protected selectedProducts: Product[] = []; // For PrimeNG table binding
  protected readonly selectedProduct = signal<Product | null>(null);
  protected contextMenuSelectedProduct: Product | null = null;
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);
  protected readonly sortField = signal<string>('name');
  protected readonly sortOrder = signal<number>(1);
  protected activeStatusFilter: string = 'all';
  protected activeTypeFilter: string = 'all';
  protected activeCategoryFilter: string = 'all';
  protected selectedSort: SortOption = this.sortOptions[2]; // Default to name ascending

  // Current menu items
  protected currentRowMenuItems: MenuItem[] = [];
  protected currentActionMenuItems: MenuItem[] = [];
  protected currentContextMenuItems: MenuItem[] = [];

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly hasSelectedItems = computed(() => this.selectedProducts.length > 0);

  /**
   * Build action menu items
   */
  private buildActionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('productList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productList.actions.deleteSelected'),
        icon: 'pi pi-trash',
        disabled: this.selectedProducts.length === 0,
        command: () => this.onBulkDelete(),
      },
    ];
  }

  /**
   * Show action menu
   */
  protected onShowActionMenu(event: MouseEvent, menu: Menu): void {
    this.currentActionMenuItems = this.buildActionMenuItems();
    menu.toggle(event);
  }

  /**
   * Build context menu items
   */
  private buildContextMenuItems(product: Product): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('productList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewProduct(product),
      },
      {
        label: this.translocoService.translate('productList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditProduct(product),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteProduct(product),
      },
    ];
  }

  /**
   * Handle context menu selection change
   */
  protected onContextMenuSelectionChange(product: Product | null): void {
    this.contextMenuSelectedProduct = product;
    if (product) {
      this.currentContextMenuItems = this.buildContextMenuItems(product);
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
    // Load product types and categories for filters
    this.loadProductTypes();
    this.loadProductCategories();

    // Load data from resolver if available
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const productListData = data['productList'];
      if (productListData) {
        this.products.set(productListData.items);
        this.totalRecords.set(productListData.total);
        this.isLoading.set(false);
      }
    });

    // Subscribe to route params for pagination, filter, and sort
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const search = params['search'] || '';
      const statusFilter = params['status'] || 'all';
      const typeFilter = params['type'] || 'all';
      const categoryFilter = params['category'] || 'all';
      const sort = params['sort'] || '[name,asc]';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.searchQuery.set(search === '-' ? '' : search);
      
      // Parse individual filters
      this.activeStatusFilter = statusFilter;
      this.activeTypeFilter = typeFilter;
      this.activeCategoryFilter = categoryFilter;

      // Parse sort array format [field,order]
      const sortStr = sort.replace(/[\[\]]/g, '');
      const sortParts = sortStr.split(',');
      if (sortParts.length === 2) {
        const [field, order] = sortParts;
        this.sortField.set(field);
        this.sortOrder.set(order === 'asc' ? 1 : -1);
        
        // Update selected sort option
        const sortOption = this.sortOptions.find(
          (opt) => opt.field === field && opt.order === (order === 'asc' ? 1 : -1)
        );
        if (sortOption) {
          this.selectedSort = sortOption;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Check viewport size
   */
  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  /**
   * Navigate to a new route with updated params
   */
  private navigateWithParams(updates: Partial<{
    search: string;
    status: string;
    type: string;
    category: string;
    sort: string;
    page: number;
    limit: number;
  }>): void {
    const currentParams = this.route.snapshot.params;
    const search = updates.search !== undefined ? updates.search : currentParams['search'];
    const status = updates.status !== undefined ? updates.status : currentParams['status'];
    const type = updates.type !== undefined ? updates.type : currentParams['type'];
    const category = updates.category !== undefined ? updates.category : currentParams['category'];
    const sort = updates.sort !== undefined ? updates.sort : currentParams['sort'];
    const page = updates.page !== undefined ? updates.page : parseInt(currentParams['page'], 10);
    const limit = updates.limit !== undefined ? updates.limit : parseInt(currentParams['limit'], 10);

    this.router.navigate([
      '/modules/management/product',
      search || '-',
      status || 'all',
      type || 'all',
      category || 'all',
      sort || '[name,asc]',
      page,
      limit,
    ]);
  }

  /**
   * Load product types from API
   */
  private loadProductTypes(): void {
    this.productTypeService.getProductTypes({ limit: 1000, isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const options: FilterOption[] = [
            { label: 'productList.filter.allTypes', value: 'all' },
            ...result.items.map(type => ({
              label: type.name,
              value: type.code
            }))
          ];
          this.typeFilterOptions.set(options);
        },
        error: (error) => {
          console.error('Error loading product types:', error);
        }
      });
  }

  /**
   * Load product categories from API
   */
  private loadProductCategories(): void {
    this.productCategoryService.getProductCategories({ limit: 1000, isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const options: FilterOption[] = [
            { label: 'productList.filter.allCategories', value: 'all' },
            ...result.items.map(cat => ({
              label: cat.name,
              value: cat.code
            }))
          ];
          this.categoryFilterOptions.set(options);
        },
        error: (error) => {
          console.error('Error loading product categories:', error);
        }
      });
  }

  /**
   * Handle search input
   */
  protected onSearch(query: string): void {
    this.searchQuery.set(query);
    this.navigateWithParams({ search: query || '-', page: 1 });
  }

  /**
   * Handle status filter change
   */
  protected onStatusFilterChange(status: string): void {
    this.activeStatusFilter = status;
    this.navigateWithParams({ status, page: 1 });
  }

  /**
   * Handle type filter change
   */
  protected onTypeFilterChange(type: string): void {
    this.activeTypeFilter = type;
    this.navigateWithParams({ type, page: 1 });
  }

  /**
   * Handle category filter change
   */
  protected onCategoryFilterChange(category: string): void {
    this.activeCategoryFilter = category;
    this.navigateWithParams({ category, page: 1 });
  }

  /**
   * Handle sort change
   */
  protected onSortChange(sortOption: SortOption): void {
    this.selectedSort = sortOption;
    this.sortField.set(sortOption.field);
    this.sortOrder.set(sortOption.order);
    const order = sortOption.order === 1 ? 'asc' : 'desc';
    this.navigateWithParams({ sort: `[${sortOption.field},${order}]`, page: 1 });
  }

  /**
   * Handle pagination change
   */
  protected onPaginationChange(event: PaginationChange): void {
    this.navigateWithParams({ page: event.page, limit: event.pageSize });
  }

  /**
   * Toggle mobile search
   */
  protected toggleMobileSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
  }

  /**
   * Add new product
   */
  protected onAddProduct(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * View product details
   */
  protected onViewProduct(product: Product): void {
    this.router.navigate([product.id, 'view'], { relativeTo: this.route });
  }

  /**
   * Edit product
   */
  protected onEditProduct(product: Product): void {
    this.router.navigate([product.id, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete single product
   */
  protected onDeleteProduct(product: Product): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('productList.delete.confirmTitle'),
      message: this.translocoService.translate('productList.delete.confirmMessage', {
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
              summary: this.translocoService.translate('productList.delete.success'),
              detail: this.translocoService.translate('productList.delete.successDetail', {
                name: product.name,
              }),
            });
            // Reload data
            this.loadProducts();
          },
          error: (error) => {
            this.isLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('productList.delete.error'),
              detail: error.message || this.translocoService.translate('productList.delete.errorDetail'),
            });
          },
        });
      },
    });
  }

  /**
   * Bulk delete selected products
   */
  protected onBulkDelete(): void {
    if (this.selectedProducts.length === 0) {
      return;
    }

    this.confirmationService.confirm({
      header: this.translocoService.translate('productList.bulkDelete.confirmTitle'),
      message: this.translocoService.translate('productList.bulkDelete.confirmMessage', {
        count: this.selectedProducts.length,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isLoading.set(true);
        const ids = this.selectedProducts.map((p) => p.id);
        this.productService.bulkDeleteProducts(ids).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('productList.bulkDelete.success'),
              detail: this.translocoService.translate('productList.bulkDelete.successDetail', {
                count: ids.length,
              }),
            });
            this.selectedProducts = [];
            this.loadProducts();
          },
          error: (error) => {
            this.isLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('productList.bulkDelete.error'),
              detail: error.message || this.translocoService.translate('productList.bulkDelete.errorDetail'),
            });
          },
        });
      },
    });
  }

  /**
   * Export products to CSV
   */
  protected onExportCSV(): void {
    const params: any = {};
    
    if (this.searchQuery() && this.searchQuery() !== '-') {
      params.search = this.searchQuery();
    }
    
    if (this.activeStatusFilter !== 'all') {
      params.status = this.activeStatusFilter;
    }

    if (this.activeTypeFilter !== 'all') {
      params.type = this.activeTypeFilter;
    }

    if (this.activeCategoryFilter !== 'all') {
      params.category = this.activeCategoryFilter;
    }

    this.productService.exportCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('productList.export.success'),
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productList.export.error'),
          detail: error.message,
        });
      },
    });
  }

  /**
   * Trigger import file selection
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
    
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('productList.import.invalidFile'),
        detail: this.translocoService.translate('productList.import.csvOnly'),
      });
      input.value = '';
      return;
    }

    this.isLoading.set(true);
    this.productService.importCSV(file).subscribe({
      next: (result) => {
        this.isLoading.set(false);
        
        if (result.failed > 0) {
          this.messageService.add({
            severity: 'warn',
            summary: this.translocoService.translate('productList.import.partialSuccess'),
            detail: this.translocoService.translate('productList.import.partialSuccessDetail', {
              success: result.success,
              failed: result.failed,
            }),
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('productList.import.success'),
            detail: this.translocoService.translate('productList.import.successDetail', {
              count: result.success,
            }),
          });
        }
        
        // Reload data
        this.loadProducts();
        input.value = '';
      },
      error: (error) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productList.import.error'),
          detail: error.message,
        });
        input.value = '';
      },
    });
  }

  /**
   * Load products from API
   */
  private loadProducts(): void {
    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize(),
    };

    if (this.searchQuery() && this.searchQuery() !== '-') {
      params.search = this.searchQuery();
    }

    if (this.activeStatusFilter !== 'all') {
      params.status = this.activeStatusFilter;
    }

    if (this.activeTypeFilter !== 'all') {
      params.type = this.activeTypeFilter;
    }

    if (this.activeCategoryFilter !== 'all') {
      params.category = this.activeCategoryFilter;
    }

    const sortOrder = this.sortOrder() === 1 ? 'asc' : 'desc';
    params.sort = `${this.sortField()}:${sortOrder}`;

    this.isLoading.set(true);
    this.productService.getProducts(params).subscribe({
      next: (data) => {
        this.products.set(data.items);
        this.totalRecords.set(data.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productList.load.error'),
          detail: error.message,
        });
      },
    });
  }

  /**
   * Get status severity for tag display
   */
  protected getStatusSeverity(status: ProductStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case ProductStatus.ACTIVE:
        return 'success';
      case ProductStatus.INACTIVE:
        return 'secondary';
      case ProductStatus.DRAFT:
        return 'info';
      case ProductStatus.DISCONTINUED:
        return 'danger';
      default:
        return undefined;
    }
  }
}
