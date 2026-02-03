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
import { Select } from 'primeng/select';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constant';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';

// Core components
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';

// Services
import { ProductTypeService } from '../../../../../../core/services/product-type/product-type.service';
import type { QueryProductTypeParams, ProductType } from '../product-type.types';

interface ScopeOption {
  label: string;
  value: string;
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
    ToolbarModule,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    Select,
    PaginationComponent,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTypeList implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

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
  protected selectedProductTypesArray: ProductType[] = []; // For PrimeNG table binding
  protected readonly selectedProductType = signal<ProductType | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentScope = signal('all');
  protected readonly currentPage = signal(1);
  protected readonly currentLimit = signal(100);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly showMobileSearch = signal(false);

  // Pagination
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  // Scope options
  protected readonly scopeOptions: ScopeOption[] = [
    { label: 'productTypeList.scope.all', value: 'all' },
    { label: 'productTypeList.scope.active', value: 'active' },
    { label: 'productTypeList.scope.inactive', value: 'inactive' },
  ];

  // Menu items
  protected readonly bulkActionMenuItems = computed<MenuItem[]>(() => [
    {
      label: this.translocoService.translate('productTypeList.actions.delete'),
      icon: 'pi pi-trash',
      command: () => this.onBulkDelete(),
    },
  ]);

  protected readonly contextMenuItems = computed<MenuItem[]>(() => [
    {
      label: this.translocoService.translate('productTypeList.actions.view'),
      icon: 'pi pi-eye',
      command: () => this.onView(),
    },
    {
      label: this.translocoService.translate('productTypeList.actions.edit'),
      icon: 'pi pi-pencil',
      command: () => this.onEdit(),
    },
    {
      separator: true,
    },
    {
      label: this.translocoService.translate('productTypeList.actions.delete'),
      icon: 'pi pi-trash',
      command: () => this.onDelete(),
    },
  ]);

  protected readonly mobileMenuItems = computed<MenuItem[]>(() => [
    {
      label: this.translocoService.translate('productTypeList.scope.all'),
      command: () => this.onScopeChange('all'),
    },
    {
      label: this.translocoService.translate('productTypeList.scope.active'),
      command: () => this.onScopeChange('active'),
    },
    {
      label: this.translocoService.translate('productTypeList.scope.inactive'),
      command: () => this.onScopeChange('inactive'),
    },
    {
      separator: true,
    },
    {
      label: this.translocoService.translate('productTypeList.actions.exportCSV'),
      icon: 'pi pi-download',
      command: () => this.onExportCSV(),
    },
  ]);

  constructor() {
    // Handle resize for responsive behavior
    this.resizeHandler = () => {
      this.isMobile.set(window.innerWidth < 768);
    };
  }

  ngOnInit(): void {
    // Check if mobile
    this.isMobile.set(window.innerWidth < 768);
    window.addEventListener('resize', this.resizeHandler!);

    // Load initial data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const productTypeList = data['productTypeList'];
      if (productTypeList) {
        this.productTypes.set(productTypeList.items);
        this.totalRecords.set(productTypeList.total);
        this.currentPage.set(productTypeList.page);
        this.currentLimit.set(productTypeList.limit);
      }
    });

    // Watch route params for changes
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.currentScope.set(params.get('scope') || 'all');
      const search = params.get('search');
      this.searchQuery.set(search && search !== '-' ? search : '');
      this.currentPage.set(Number(params.get('page')) || 1);
      this.currentLimit.set(Number(params.get('limit')) || 100);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Navigate with current state
   */
  protected navigateToRoute(params: { scope?: string; search?: string; page?: number; limit?: number; action?: string; id?: string }): void {
    const scope = params.scope ?? this.currentScope();
    const search = params.search !== undefined ? (params.search || '-') : (this.searchQuery() || '-');
    const page = params.page ?? this.currentPage();
    const limit = params.limit ?? this.currentLimit();

    const segments = [`/management/product-type/${scope}/${search}/${page}/${limit}`];
    
    if (params.action && params.id) {
      segments.push(`${params.id}/${params.action}`);
    } else if (params.action) {
      segments.push(params.action);
    }

    this.router.navigate(segments);
  }

  /**
   * Search handler
   */
  protected onSearch(event?: Event): void {
    const query = this.searchQuery().trim();
    this.navigateToRoute({ search: query, page: 1 });
  }

  /**
   * Scope change handler
   */
  protected onScopeChange(scope: string): void {
    this.navigateToRoute({ scope, page: 1 });
  }

  /**
   * Page change handler
   */
  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.navigateToRoute({ page: event.page, limit: event.pageSize });
  }

  /**
   * Refresh list
   */
  protected async onRefresh(): Promise<void> {
    this.isLoading.set(true);
    try {
      const params: QueryProductTypeParams = {
        page: this.currentPage(),
        limit: this.currentLimit(),
        search: this.searchQuery() || undefined,
      };

      // Add scope filter
      const scope = this.currentScope();
      if (scope === 'active') {
        params.isActive = true;
      } else if (scope === 'inactive') {
        params.isActive = false;
      }

      const result = await this.productTypeService.getProductTypes(params).toPromise();
      if (result) {
        this.productTypes.set(result.items);
        this.totalRecords.set(result.total);
      }
      
      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate('common.success'),
        detail: this.translocoService.translate('productTypeList.messages.refreshed'),
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('common.error'),
        detail: this.translocoService.translate('productTypeList.messages.refreshError'),
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Open create form
   */
  protected onNew(): void {
    this.navigateToRoute({ action: 'new' });
  }

  /**
   * Open view form
   */
  protected onView(): void {
    const selected = this.selectedProductType();
    if (selected) {
      this.navigateToRoute({ action: 'view', id: selected.id });
    }
  }

  /**
   * Open edit form
   */
  protected onEdit(): void {
    const selected = this.selectedProductType();
    if (selected) {
      this.navigateToRoute({ action: 'edit', id: selected.id });
    }
  }

  /**
   * Delete product type
   */
  protected onDelete(): void {
    const selected = this.selectedProductType();
    if (!selected) return;

    this.confirmationService.confirm({
      message: this.translocoService.translate('productTypeList.confirmDelete.message', { name: selected.name }),
      header: this.translocoService.translate('productTypeList.confirmDelete.header'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('common.yes'),
      rejectLabel: this.translocoService.translate('common.no'),
      accept: async () => {
        try {
          await this.productTypeService.deleteProductType(selected.id).toPromise();
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('common.success'),
            detail: this.translocoService.translate('productTypeList.messages.deleted'),
          });
          this.onRefresh();
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('common.error'),
            detail: this.translocoService.translate('productTypeList.messages.deleteError'),
          });
        }
      },
    });
  }

  /**
   * Bulk delete product types
   */
  protected onBulkDelete(): void {
    if (this.selectedProductTypesArray.length === 0) return;

    this.confirmationService.confirm({
      message: this.translocoService.translate('productTypeList.confirmBulkDelete.message', { count: this.selectedProductTypesArray.length }),
      header: this.translocoService.translate('productTypeList.confirmBulkDelete.header'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('common.yes'),
      rejectLabel: this.translocoService.translate('common.no'),
      accept: async () => {
        try {
          const promises = this.selectedProductTypesArray.map((pt) =>
            this.productTypeService.deleteProductType(pt.id).toPromise()
          );
          await Promise.all(promises);
          
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('common.success'),
            detail: this.translocoService.translate('productTypeList.messages.bulkDeleted', { count: this.selectedProductTypesArray.length }),
          });
          this.selectedProductTypesArray = [];
          this.onRefresh();
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('common.error'),
            detail: this.translocoService.translate('productTypeList.messages.bulkDeleteError'),
          });
        }
      },
    });
  }

  /**
   * Export to CSV
   */
  protected async onExportCSV(): Promise<void> {
    try {
      const params: QueryProductTypeParams = {
        search: this.searchQuery() || undefined,
      };

      // Add scope filter
      const scope = this.currentScope();
      if (scope === 'active') {
        params.isActive = true;
      } else if (scope === 'inactive') {
        params.isActive = false;
      }

      const blob = await this.productTypeService.exportCSV(params).toPromise();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-types-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('common.success'),
          detail: this.translocoService.translate('productTypeList.messages.exported'),
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('common.error'),
        detail: this.translocoService.translate('productTypeList.messages.exportError'),
      });
    }
  }

  /**
   * Context menu show handler
   */
  protected onContextMenu(event: MouseEvent, productType: ProductType): void {
    this.selectedProductType.set(productType);
    this.contextMenu.show(event);
    event.preventDefault();
  }

  /**
   * Row select handler
   */
  protected onRowSelect(productType: ProductType): void {
    this.selectedProductType.set(productType);
  }

  /**
   * Toggle mobile search
   */
  protected toggleMobileSearch(): void {
    this.showMobileSearch.update((v) => !v);
    if (this.showMobileSearch()) {
      setTimeout(() => {
        this.mobileSearchInput?.nativeElement?.focus();
      }, this.SEARCH_FOCUS_DELAY);
    }
  }

  /**
   * Handle mobile row action
   */
  protected onMobileRowAction(event: Event, productType: ProductType): void {
    event.stopPropagation();
    this.selectedProductType.set(productType);
  }
}
