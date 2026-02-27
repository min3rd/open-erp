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
import {
  StockService,
  Serial,
  SerialStatus,
} from '../../../../../../core/services/stock/stock.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

@Component({
  selector: 'serials',
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
  templateUrl: './serials.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Serials implements OnInit {
  private readonly stockService = inject(StockService);

  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  serials = signal<Serial[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  page = signal(1);
  limit = signal(PAGE_SIZE_OPTIONS[0]);
  statusFilter = signal<string>('');

  statusOptions = [
    { label: 'All', value: '' },
    { label: 'Available', value: 'available' },
    { label: 'Reserved', value: 'reserved' },
    { label: 'In Transit', value: 'in-transit' },
    { label: 'Consumed', value: 'consumed' },
  ];

  ngOnInit() {
    this.loadSerials();
  }

  loadSerials() {
    this.loading.set(true);
    const status = this.statusFilter() ? (this.statusFilter() as SerialStatus) : undefined;

    this.stockService
      .getSerials({ status, page: this.page(), limit: this.limit() })
      .subscribe({
        next: (result: { items: Serial[]; total: number }) => {
          this.serials.set(result.items);
          this.totalRecords.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPageChange(event: any) {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.limit.set(event.rows);
    this.loadSerials();
  }

  onFilterChange() {
    this.page.set(1);
    this.loadSerials();
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'available':
        return 'success';
      case 'reserved':
        return 'warn';
      case 'in-transit':
        return 'info';
      case 'consumed':
        return 'danger';
      default:
        return 'info';
    }
  }
}
