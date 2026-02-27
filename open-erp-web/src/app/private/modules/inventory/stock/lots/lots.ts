import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { StockService, Lot } from '../../../../../../core/services/stock/stock.service';

@Component({
  selector: 'lots',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
  ],
  templateUrl: './lots.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lots implements OnInit {
  private readonly stockService = inject(StockService);

  lots = signal<Lot[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  page = signal(1);
  limit = signal(20);
  expiredFilter = signal<string>('');

  expiredOptions = [
    { label: 'All', value: '' },
    { label: 'Expired', value: 'true' },
    { label: 'Valid', value: 'false' },
  ];

  ngOnInit() {
    this.loadLots();
  }

  loadLots() {
    this.loading.set(true);
    const expired =
      this.expiredFilter() === 'true'
        ? true
        : this.expiredFilter() === 'false'
          ? false
          : undefined;

    this.stockService
      .getLots({ expired, page: this.page(), limit: this.limit() })
      .subscribe({
        next: (result: { items: Lot[]; total: number }) => {
          this.lots.set(result.items);
          this.totalRecords.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(event: any) {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.limit.set(event.rows);
    this.loadLots();
  }

  onFilterChange() {
    this.page.set(1);
    this.loadLots();
  }

  isExpired(lot: Lot): boolean {
    if (!lot.expiryAt) return false;
    return new Date(lot.expiryAt) < new Date();
  }

  getExpirySeverity(lot: Lot): 'success' | 'warn' | 'danger' | 'info' {
    if (!lot.expiryAt) return 'info';
    const diff = new Date(lot.expiryAt).getTime() - Date.now();
    if (diff < 0) return 'danger';
    if (diff < 30 * 24 * 60 * 60 * 1000) return 'warn';
    return 'success';
  }
}
