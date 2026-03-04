import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MultiSelectModule } from 'primeng/multiselect';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import { StockService } from '../../../../../../core/services/stock/stock.service';
import { InventoryStock, StockSummary } from '../../../../../../core/services/stock/stock.types';
import {
  WarehouseService,
  Warehouse,
} from '../../../../../../core/services/warehouse/warehouse.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';
import { Subject, takeUntil, combineLatest } from 'rxjs';

interface ColumnDef {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
}

@Component({
  selector: 'stock-list',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    InputGroupModule,
    InputGroupAddonModule,
    MultiSelectModule,
    MpToolbar,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockList implements OnInit, OnDestroy {
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private readonly stockService = inject(StockService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  private readonly SEARCH_FOCUS_DELAY = 100;
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  protected readonly columnOptions: ColumnDef[] = [
    { field: 'sku', header: 'stock.sku', sortable: true, width: '150px' },
    { field: 'name', header: 'stock.productName', sortable: true },
    { field: 'unit', header: 'stock.unit', sortable: false, width: '80px' },
    { field: 'onHand', header: 'stock.onHand', sortable: true, width: '120px' },
    { field: 'available', header: 'stock.available', sortable: true, width: '120px' },
    { field: 'reserved', header: 'stock.reserved', sortable: true, width: '120px' },
    { field: 'inTransit', header: 'stock.inTransit', sortable: true, width: '120px' },
    { field: 'damaged', header: 'stock.damaged', sortable: true, width: '120px' },
    { field: 'location', header: 'stock.location', sortable: false, width: '140px' },
    { field: 'status', header: 'stock.status', sortable: false, width: '100px' },
  ];
  protected selectedColumns: ColumnDef[] = [...this.columnOptions];

  // State signals
  stocks = signal<InventoryStock[]>([]);
  warehouses = signal<Warehouse[]>([]);
  summary = signal<StockSummary | null>(null);
  selectedWarehouseId = signal<string>('');
  loading = signal(false);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  searchQuery = signal('');
  sortField = signal<string>('sku');
  sortOrder = signal<number>(1);
  isMobile = signal(false);
  isSearchOpen = signal(false);

  warehouseOptions = computed(() =>
    this.warehouses().map((w) => ({ label: `${w.code} - ${w.name}`, value: w.id })),
  );

  constructor() {
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }

    effect(() => {
      if (this.isSearchOpen() && this.mobileSearchInput) {
        setTimeout(() => {
          this.mobileSearchInput?.nativeElement?.focus();
        }, this.SEARCH_FOCUS_DELAY);
      }
    });
  }

  ngOnInit() {
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, queryParams]) => {
        const page = parseInt(params['page'], 10) || 1;
        const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
        const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
        const search = params['search'] || '';

        this.currentPage.set(page);
        this.pageSize.set(normalizedLimit);
        this.searchQuery.set(search === '-' ? '' : search);

        // Restore sort from query params
        if (queryParams['sortField']) {
          this.sortField.set(queryParams['sortField']);
        }
        if (queryParams['sortOrder']) {
          this.sortOrder.set(parseInt(queryParams['sortOrder'], 10) || 1);
        }

        // Restore warehouse from query params
        if (queryParams['warehouseId']) {
          this.selectedWarehouseId.set(queryParams['warehouseId']);
        }

        // Load stock if warehouse is set, otherwise wait for warehouse load
        if (this.selectedWarehouseId()) {
          this.loadStock();
        }
      });

    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  loadWarehouses() {
    this.warehouseService.getWarehouses({ page: 1, limit: 100 }).subscribe((result) => {
      this.warehouses.set(result.items);
      if (result.items.length > 0 && !this.selectedWarehouseId()) {
        this.selectedWarehouseId.set(result.items[0].id);
        this.loadStock();
      }
    });
  }

  onWarehouseChange(warehouseId: string) {
    this.selectedWarehouseId.set(warehouseId);
    this.navigateWithState(1);
  }

  loadStock() {
    const whId = this.selectedWarehouseId();
    if (!whId) return;

    this.loading.set(true);
    this.stockService
      .getWarehouseStock(whId, {
        page: this.currentPage(),
        limit: this.pageSize(),
        q: this.searchQuery() || undefined,
        sortField: this.sortField(),
        sortOrder: this.sortOrder(),
      })
      .subscribe({
        next: (result) => {
          this.stocks.set(result.items);
          this.totalRecords.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    this.stockService.getWarehouseStockSummary(whId).subscribe({
      next: (s) => this.summary.set(s),
    });
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchValue = input.value || '-';
    this.router.navigate(['../../..', searchValue, 1, this.pageSize()], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(),
    });
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows && event.rows > 0 ? event.rows : PAGE_SIZE_OPTIONS[0];
    const page = event.first !== undefined ? Math.floor(event.first / rows) + 1 : 1;

    if (event.sortField) {
      this.sortField.set(event.sortField as string);
      this.sortOrder.set(event.sortOrder || 1);
    }

    this.navigateWithState(page, rows);
  }

  protected refresh() {
    this.loadStock();
  }

  protected toggleSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
  }

  protected closeSearch(): void {
    this.isSearchOpen.set(false);
    this.router.navigate(['../../..', '-', 1, this.pageSize()], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(),
    });
  }

  getStockSeverity(stock: InventoryStock): 'success' | 'warn' | 'danger' | 'info' {
    if (stock.availableQuantity <= 0) return 'danger';
    if (stock.reservedQuantity > 0 && stock.availableQuantity < stock.reservedQuantity)
      return 'warn';
    return 'success';
  }

  getOnHand(stock: InventoryStock): number {
    return (
      stock.availableQuantity +
      stock.reservedQuantity +
      stock.damagedQuantity
    );
  }

  private navigateWithState(page?: number, pageSize?: number): void {
    const search = this.searchQuery() || '-';
    const p = page ?? this.currentPage();
    const ps = pageSize ?? this.pageSize();
    this.router.navigate(['../../..', search, p, ps], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(),
    });
  }

  private buildQueryParams(): Record<string, string> {
    const qp: Record<string, string> = {};
    if (this.sortField() && this.sortField() !== 'sku') {
      qp['sortField'] = this.sortField();
    }
    if (this.sortOrder() !== 1) {
      qp['sortOrder'] = this.sortOrder().toString();
    }
    if (this.selectedWarehouseId()) {
      qp['warehouseId'] = this.selectedWarehouseId();
    }
    return qp;
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }
}
