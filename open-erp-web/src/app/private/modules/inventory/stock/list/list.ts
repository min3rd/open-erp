import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import {
  StockService,
  InventoryStock,
  StockSummary,
} from '../../../../../../core/services/stock/stock.service';
import {
  WarehouseService,
  Warehouse,
} from '../../../../../../core/services/warehouse/warehouse.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

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
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockList implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly warehouseService = inject(WarehouseService);

  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  // State signals
  stocks = signal<InventoryStock[]>([]);
  warehouses = signal<Warehouse[]>([]);
  summary = signal<StockSummary | null>(null);
  selectedWarehouseId = signal<string>('');
  loading = signal(false);
  totalRecords = signal(0);
  page = signal(1);
  limit = signal(PAGE_SIZE_OPTIONS[0]);
  searchQuery = signal('');

  warehouseOptions = computed(() =>
    this.warehouses().map((w) => ({ label: `${w.code} - ${w.name}`, value: w.id })),
  );

  filteredStocks = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.stocks();
    return this.stocks().filter(
      (s) =>
        s.productSnapshot.sku.toLowerCase().includes(query) ||
        s.productSnapshot.name.toLowerCase().includes(query),
    );
  });

  ngOnInit() {
    this.loadWarehouses();
  }

  loadWarehouses() {
    this.warehouseService.getWarehouses({ page: 1, limit: 100 }).subscribe((result) => {
      this.warehouses.set(result.items);
      if (result.items.length > 0) {
        this.selectedWarehouseId.set(result.items[0].id);
        this.loadStock();
      }
    });
  }

  onWarehouseChange(warehouseId: string) {
    this.selectedWarehouseId.set(warehouseId);
    this.page.set(1);
    this.loadStock();
  }

  loadStock() {
    const whId = this.selectedWarehouseId();
    if (!whId) return;

    this.loading.set(true);
    this.stockService
      .getWarehouseStock(whId, { page: this.page(), limit: this.limit() })
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

  onPageChange(event: any) {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.limit.set(event.rows);
    this.loadStock();
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

  refresh() {
    this.loadStock();
  }
}
