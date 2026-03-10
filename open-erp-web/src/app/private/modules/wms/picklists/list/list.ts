import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
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
import { MultiSelectModule } from 'primeng/multiselect';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DrawerModule } from 'primeng/drawer';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import {
  WmsService,
  Picklist,
  PicklistStatus,
} from '../../../../../../core/services/wms/wms.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';
import { Subject, takeUntil, combineLatest } from 'rxjs';

interface ColumnDef {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
}

@Component({
  selector: 'picklist-list',
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
    MultiSelectModule,
    InputGroupModule,
    InputGroupAddonModule,
    DrawerModule,
    MpToolbar,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicklistList implements OnInit, OnDestroy {
  private readonly wmsService = inject(WmsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  protected readonly columnOptions: ColumnDef[] = [
    { field: 'lines', header: 'wms.picklists.linesCount', sortable: false, width: '80px' },
    { field: 'orders', header: 'wms.picklists.orders', sortable: false, width: '80px' },
    { field: 'status', header: 'wms.picklists.status', sortable: true, width: '130px' },
    { field: 'notes', header: 'wms.picklists.notes', sortable: false },
    { field: 'createdAt', header: 'wms.picklists.createdAt', sortable: true, width: '160px' },
  ];
  protected selectedColumns: ColumnDef[] = [...this.columnOptions];

  protected readonly statusOptions = Object.values(PicklistStatus).map((s) => ({
    label: s,
    value: s,
  }));

  picklists = signal<Picklist[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  searchQuery = signal('');
  selectedStatus = signal<PicklistStatus | undefined>(undefined);
  sortField = signal<string>('createdAt');
  sortOrder = signal<number>(-1);
  selectedPicklist = signal<Picklist | null>(null);
  drawerVisible = signal(false);
  isMobile = signal(false);

  private resizeHandler: (() => void) | null = null;

  constructor() {
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  ngOnInit() {
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, queryParams]) => {
        const page = parseInt(params['page'], 10) || 1;
        const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
        const search = params['search'] || '';
        this.currentPage.set(page);
        this.pageSize.set(PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0]);
        this.searchQuery.set(search === '-' ? '' : search);
        if (queryParams['status']) this.selectedStatus.set(queryParams['status'] as PicklistStatus);
        if (queryParams['sortField']) this.sortField.set(queryParams['sortField']);
        if (queryParams['sortOrder']) this.sortOrder.set(parseInt(queryParams['sortOrder'], 10));
        this.loadPicklists();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  loadPicklists() {
    this.loading.set(true);
    this.wmsService
      .getPicklists({
        page: this.currentPage(),
        limit: this.pageSize(),
        status: this.selectedStatus(),
        q: this.searchQuery() || undefined,
        sortField: this.sortField(),
        sortOrder: this.sortOrder() as 1 | -1,
      })
      .subscribe({
        next: (result) => {
          this.picklists.set(result.items);
          this.totalRecords.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected refresh() {
    this.loadPicklists();
  }

  protected onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value || '-';
    this.searchQuery.set(value === '-' ? '' : value);
    this.navigateWithState(1);
  }

  protected onStatusChange(status: PicklistStatus | undefined) {
    this.selectedStatus.set(status);
    this.navigateWithState(1);
  }

  protected onLazyLoad(event: TableLazyLoadEvent) {
    const rows = event.rows && event.rows > 0 ? event.rows : PAGE_SIZE_OPTIONS[0];
    const page = event.first !== undefined ? Math.floor(event.first / rows) + 1 : 1;

    if (event.sortField) {
      this.sortField.set(event.sortField as string);
      this.sortOrder.set(event.sortOrder || -1);
    }

    this.navigateWithState(page, rows);
  }

  private buildQueryParams(): Record<string, string> {
    const qp: Record<string, string> = {};
    if (this.sortField() && this.sortField() !== 'createdAt') {
      qp['sortField'] = this.sortField();
    }
    if (this.sortOrder() !== -1) {
      qp['sortOrder'] = this.sortOrder().toString();
    }
    if (this.selectedStatus()) {
      qp['status'] = this.selectedStatus()!;
    }
    return qp;
  }

  private navigateWithState(page?: number, rows?: number): void {
    const search = this.searchQuery() || '-';
    const p = page ?? this.currentPage();
    const r = rows ?? this.pageSize();
    this.router.navigate(['../../..', search, p, r], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(),
    });
  }

  protected openDetail(picklist: Picklist) {
    this.selectedPicklist.set(picklist);
    this.drawerVisible.set(true);
  }

  protected closeDrawer() {
    this.drawerVisible.set(false);
    this.selectedPicklist.set(null);
  }

  protected getStatusSeverity(
    status: PicklistStatus,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<PicklistStatus, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      [PicklistStatus.COMPLETED]: 'success',
      [PicklistStatus.ASSIGNED]: 'info',
      [PicklistStatus.IN_PROGRESS]: 'warn',
      [PicklistStatus.PARTIAL]: 'warn',
      [PicklistStatus.CANCELLED]: 'danger',
      [PicklistStatus.DRAFT]: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }
}
