import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MultiSelectModule } from 'primeng/multiselect';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import { StockService } from '../../../../../../core/services/stock/stock.service';
import { Lot } from '../../../../../../core/services/stock/stock.types';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';
import { Subject, takeUntil } from 'rxjs';

interface ColumnDef {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
}

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
    SelectModule,
    InputGroupModule,
    InputGroupAddonModule,
    MultiSelectModule,
    MpToolbar,
  ],
  templateUrl: './lots.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lots implements OnInit, OnDestroy {
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private readonly stockService = inject(StockService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  private readonly SEARCH_FOCUS_DELAY = 100;
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  protected readonly columnOptions: ColumnDef[] = [
    { field: 'lotCode', header: 'stock.lots.lotCode', sortable: true, width: '180px' },
    { field: 'skuId', header: 'stock.lots.skuId', sortable: true },
    { field: 'totalQty', header: 'stock.lots.totalQty', sortable: true, width: '120px' },
    { field: 'remainingQty', header: 'stock.lots.remainingQty', sortable: true, width: '120px' },
    {
      field: 'manufacturedAt',
      header: 'stock.lots.manufacturedAt',
      sortable: true,
      width: '150px',
    },
    { field: 'expiryAt', header: 'stock.lots.expiryAt', sortable: true, width: '150px' },
    { field: 'status', header: 'stock.status', sortable: false, width: '100px' },
  ];
  protected selectedColumns: ColumnDef[] = [...this.columnOptions];

  lots = signal<Lot[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  searchQuery = signal('');
  expiredFilter = signal<string>('');
  sortField = signal<string>('lotCode');
  sortOrder = signal<number>(1);
  isMobile = signal(false);
  isSearchOpen = signal(false);

  expiredOptions = [
    { label: 'All', value: '' },
    { label: 'Expired', value: 'true' },
    { label: 'Valid', value: 'false' },
  ];

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
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const search = params['search'] || '';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.searchQuery.set(search === '-' ? '' : search);
    });

    this.loadLots();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  loadLots() {
    this.loading.set(true);
    const expired =
      this.expiredFilter() === 'true' ? true : this.expiredFilter() === 'false' ? false : undefined;

    this.stockService
      .getLots({ expired, page: this.currentPage(), limit: this.pageSize() })
      .subscribe({
        next: (result: { items: Lot[]; total: number }) => {
          this.lots.set(result.items);
          this.totalRecords.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchValue = input.value || '-';
    this.router.navigate(['../../..', searchValue, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows && event.rows > 0 ? event.rows : PAGE_SIZE_OPTIONS[0];
    const page = event.first !== undefined ? Math.floor(event.first / rows) + 1 : 1;

    if (event.sortField) {
      this.sortField.set(event.sortField as string);
      this.sortOrder.set(event.sortOrder || 1);
    }

    if (page !== this.currentPage() || rows !== this.pageSize()) {
      this.navigateWithState(page, rows);
    } else {
      this.loadLots();
    }
  }

  onFilterChange() {
    this.navigateWithState(1);
  }

  protected toggleSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
  }

  protected closeSearch(): void {
    this.isSearchOpen.set(false);
    this.router.navigate(['../../..', '-', 1, this.pageSize()], {
      relativeTo: this.route,
    });
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

  private navigateWithState(page?: number, pageSize?: number): void {
    const search = this.searchQuery() || '-';
    const p = page ?? this.currentPage();
    const ps = pageSize ?? this.pageSize();
    this.router.navigate(['../../..', search, p, ps], {
      relativeTo: this.route,
    });
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }
}
