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
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';

// Services
import { ProductCategoryService } from '../../../../../../core/services/product-category/product-category.service';
import { ProductCategory } from '../product-category.types';

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
 * Filter option for isActive status
 */
interface FilterOption {
  label: string;
  value: 'all' | 'active' | 'inactive';
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
  selector: 'management-product-category-list',
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
export class ProductCategoryList implements OnInit, OnDestroy {
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productCategoryService = inject(ProductCategoryService);
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
    { field: 'code', header: 'productCategoryList.table.code', sortable: true, width: '150px' },
    { field: 'name', header: 'productCategoryList.table.name', sortable: true },
    { field: 'parentId', header: 'productCategoryList.table.parent', sortable: false, width: '150px' },
    { field: 'description', header: 'productCategoryList.table.description', sortable: false },
    { field: 'isActive', header: 'productCategoryList.table.status', sortable: true, width: '100px' },
    { field: 'order', header: 'productCategoryList.table.order', sortable: true, width: '100px' },
    { field: 'level', header: 'productCategoryList.table.level', sortable: true, width: '100px' },
  ];
  protected selectedColumns: ColumnDef[] = [...this.columnOptions];

  // Filter options
  protected readonly filterOptions: FilterOption[] = [
    { label: 'productCategoryList.filter.all', value: 'all' },
    { label: 'productCategoryList.filter.active', value: 'active' },
    { label: 'productCategoryList.filter.inactive', value: 'inactive' },
  ];

  // Sort options
  protected readonly sortOptions: SortOption[] = [
    { label: 'productCategoryList.sort.codeAsc', field: 'code', order: 1 },
    { label: 'productCategoryList.sort.codeDesc', field: 'code', order: -1 },
    { label: 'productCategoryList.sort.nameAsc', field: 'name', order: 1 },
    { label: 'productCategoryList.sort.nameDesc', field: 'name', order: -1 },
    { label: 'productCategoryList.sort.orderAsc', field: 'order', order: 1 },
    { label: 'productCategoryList.sort.orderDesc', field: 'order', order: -1 },
    { label: 'productCategoryList.sort.levelAsc', field: 'level', order: 1 },
    { label: 'productCategoryList.sort.levelDesc', field: 'level', order: -1 },
  ];

  // State signals
  protected readonly categories = signal<ProductCategory[]>([]);
  protected selectedCategories: ProductCategory[] = []; // For PrimeNG table binding
  protected readonly selectedCategory = signal<ProductCategory | null>(null);
  protected contextMenuSelectedCategory: ProductCategory | null = null; // For context menu selection
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);
  protected readonly sortField = signal<string>('name');
  protected readonly sortOrder = signal<number>(1); // 1 = ascending, -1 = descending
  protected readonly activeFilter = signal<string>('all'); // 'all', 'active', 'inactive'
  protected selectedSort: SortOption = this.sortOptions[2]; // Default to name ascending

  // Current row menu items - to fix double-click issue
  protected currentRowMenuItems: MenuItem[] = [];

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly hasSelectedItems = computed(() => this.selectedCategories.length > 0);

  // Pre-populated action menu items to fix click issue
  protected currentActionMenuItems: MenuItem[] = [];

  // Build action menu items dynamically
  private buildActionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('productCategoryList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productCategoryList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productCategoryList.actions.deleteSelected'),
        icon: 'pi pi-trash',
        disabled: this.selectedCategories.length === 0,
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

  // Build context menu items for a product category
  private buildContextMenuItems(category: ProductCategory): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('productCategoryList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewCategory(category),
      },
      {
        label: this.translocoService.translate('productCategoryList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditCategory(category),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productCategoryList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteCategory(category),
      },
    ];
  }

  /**
   * Handle context menu selection change - update menu items when selection changes
   */
  protected onContextMenuSelectionChange(category: ProductCategory | null): void {
    this.contextMenuSelectedCategory = category;
    if (category) {
      this.currentContextMenuItems = this.buildContextMenuItems(category);
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
      const productCategoryListData = data['productCategoryList'];
      if (productCategoryListData) {
        this.categories.set(productCategoryListData.items);
        this.totalRecords.set(productCategoryListData.total);
        this.isLoading.set(false);
      }
    });

    // Subscribe to route params for pagination, filter, and sort
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const search = params['search'] || '';
      const filter = params['filter'] || 'all';
      const sort = params['sort'] || '[name,asc]';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.searchQuery.set(search === '-' ? '' : search);
      this.activeFilter.set(filter);
      
      // Parse sort array format [field1,order1,field2,order2,...]
      const sortStr = sort.replace(/[\[\]]/g, '');
      const sortParts = sortStr.split(',').map((s: string) => s.trim());
      
      // Use first field-order pair for UI
      if (sortParts.length >= 2) {
        this.sortField.set(sortParts[0]);
        this.sortOrder.set(sortParts[1] === 'desc' ? -1 : 1);
        
        // Update selected sort option
        const sortOption = this.sortOptions.find(opt => 
          opt.field === sortParts[0] && 
          ((opt.order === 1 && sortParts[1] === 'asc') || (opt.order === -1 && sortParts[1] === 'desc'))
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
    const filter = this.activeFilter();
    const sortStr = `[${this.sortField()},${this.sortOrder() === 1 ? 'asc' : 'desc'}]`;
    this.router.navigate(['../../../..', searchValue, filter, sortStr, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Handle filter change
   */
  protected onFilterChange(filterValue: 'all' | 'active' | 'inactive'): void {
    const search = this.searchQuery() || '-';
    const sortStr = `[${this.sortField()},${this.sortOrder() === 1 ? 'asc' : 'desc'}]`;
    this.router.navigate(['../../../..', search, filterValue, sortStr, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Handle sort change
   */
  protected onSortChange(sort: SortOption): void {
    this.selectedSort = sort;
    const search = this.searchQuery() || '-';
    const filter = this.activeFilter();
    const sortStr = `[${sort.field},${sort.order === 1 ? 'asc' : 'desc'}]`;
    this.router.navigate(['../../../..', search, filter, sortStr, 1, this.pageSize()], {
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
    const filter = this.activeFilter();
    const sortStr = `[${this.sortField()},${this.sortOrder() === 1 ? 'asc' : 'desc'}]`;

    this.router.navigate(['../../../..', search, filter, sortStr, newPage, newPageSize], {
      relativeTo: this.route,
    });
  }

  /**
   * Navigate to add new product category
   */
  protected onAddCategory(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Export product categories to CSV
   */
  protected onExportCSV(): void {
    // Parse filter to isActive boolean
    const filter = this.activeFilter();
    let isActive: boolean | undefined = undefined;
    if (filter === 'active') {
      isActive = true;
    } else if (filter === 'inactive') {
      isActive = false;
    }
    
    const params = {
      search: this.searchQuery() || undefined,
      isActive,
    };
    this.productCategoryService.exportCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `product-categories-${new Date().toISOString()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('productCategoryList.messages.success'),
          detail: this.translocoService.translate('productCategoryList.messages.exportSuccess'),
        });
      },
      error: (error: any) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('productCategoryList.messages.error'),
          detail: this.translocoService.translate('productCategoryList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Import product categories
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
    this.productCategoryService.importCSV(file).subscribe({
      next: (result) => {
        if (result.failed === 0) {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('productCategoryList.messages.success'),
            detail: this.translocoService.translate('productCategoryList.messages.importSuccess', {
              count: result.success,
            }),
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: this.translocoService.translate('productCategoryList.messages.warning'),
            detail: this.translocoService.translate('productCategoryList.messages.importPartial', {
              success: result.success,
              error: result.failed,
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
          summary: this.translocoService.translate('productCategoryList.messages.error'),
          detail: this.translocoService.translate('productCategoryList.messages.importFailed'),
        });
        this.isLoading.set(false);
      },
    });

    // Reset file input
    input.value = '';
  }

  /**
   * Bulk delete selected product categories
   */
  protected onBulkDelete(): void {
    const selected = this.selectedCategories;
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      header: this.translocoService.translate('productCategoryList.confirmBulkDelete.header'),
      message: this.translocoService.translate('productCategoryList.confirmBulkDelete.message', {
        count: selected.length,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('productCategoryList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('productCategoryList.confirmDelete.reject'),
      accept: () => {
        // Delete one by one since backend doesn't have bulk delete
        let completed = 0;
        let errors = 0;
        selected.forEach((cat) => {
          this.productCategoryService.deleteProductCategory(cat.id).subscribe({
            next: () => {
              completed++;
              if (completed + errors === selected.length) {
                this.messageService.add({
                  severity: errors > 0 ? 'warn' : 'success',
                  summary: this.translocoService.translate('productCategoryList.messages.success'),
                  detail: this.translocoService.translate(
                    'productCategoryList.messages.bulkDeleteSuccess',
                    {
                      count: completed,
                    },
                  ),
                });
                this.selectedCategories = [];
                this.onRefresh();
              }
            },
            error: () => {
              errors++;
              if (completed + errors === selected.length) {
                this.messageService.add({
                  severity: 'error',
                  summary: this.translocoService.translate('productCategoryList.messages.error'),
                  detail: this.translocoService.translate(
                    'productCategoryList.messages.bulkDeleteFailed',
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
   * Handle row click to select product category
   */
  protected onRowClick(category: ProductCategory): void {
    this.selectedCategory.set(category);
  }

  /**
   * View product category details
   */
  protected onViewCategory(category: ProductCategory): void {
    this.router.navigate([category.id], { relativeTo: this.route });
  }

  /**
   * Edit product category
   */
  protected onEditCategory(category: ProductCategory): void {
    this.router.navigate([category.id, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete a product category
   */
  protected onDeleteCategory(category: ProductCategory): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('productCategoryList.confirmDelete.header'),
      message: this.translocoService.translate('productCategoryList.confirmDelete.message', {
        name: category.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('productCategoryList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('productCategoryList.confirmDelete.reject'),
      accept: () => {
        this.productCategoryService.deleteProductCategory(category.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('productCategoryList.messages.success'),
              detail: this.translocoService.translate('productCategoryList.messages.deleteSuccess', {
                name: category.name,
              }),
            });
            if (this.selectedCategory()?.id === category.id) {
              this.selectedCategory.set(null);
            }
            this.onRefresh();
          },
          error: (error: any) => {
            console.error('Delete failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('productCategoryList.messages.error'),
              detail: this.translocoService.translate('productCategoryList.messages.deleteFailed'),
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
    const filter = this.activeFilter();
    const sortStr = `[${this.sortField()},${this.sortOrder() === 1 ? 'asc' : 'desc'}]`;
    this.router.navigate(['../../../..', search, filter, sortStr, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Refresh product category list
   */
  protected onRefresh(): void {
    this.isLoading.set(true);
    
    // Parse filter to isActive boolean
    const filter = this.activeFilter();
    let isActive: boolean | undefined = undefined;
    if (filter === 'active') {
      isActive = true;
    } else if (filter === 'inactive') {
      isActive = false;
    }
    
    // Build sort array format
    const sortStr = `[${this.sortField()},${this.sortOrder() === 1 ? 'asc' : 'desc'}]`;
    
    this.productCategoryService
      .getProductCategories({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchQuery() || undefined,
        isActive,
        sort: sortStr,
      })
      .subscribe({
        next: (data) => {
          this.categories.set(data.items);
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
  protected getRowMenuItems(category: ProductCategory): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('productCategoryList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewCategory(category),
      },
      {
        label: this.translocoService.translate('productCategoryList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditCategory(category),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('productCategoryList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteCategory(category),
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
  protected onShowRowMenu(event: MouseEvent, category: ProductCategory, menu: Menu): void {
    event.stopPropagation();
    this.currentRowMenuItems = this.getRowMenuItems(category);
    menu.toggle(event);
  }

  /**
   * Get translated label for filter option
   */
  protected getFilterLabel(option: FilterOption): string {
    return this.translocoService.translate(option.label);
  }

  /**
   * Get translated label for sort option
   */
  protected getSortLabel(option: SortOption): string {
    return this.translocoService.translate(option.label);
  }
}
