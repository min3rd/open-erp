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
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DrawerModule } from 'primeng/drawer';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import { WmsService, Receipt, ReceiptStatus } from '../../../../../../core/services/wms/wms.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'receipt-list',
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
    DrawerModule,
    MpToolbar,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptList implements OnInit, OnDestroy {
  private readonly wmsService = inject(WmsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  protected readonly statusOptions = Object.values(ReceiptStatus).map((s) => ({
    label: s,
    value: s,
  }));

  receipts = signal<Receipt[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  searchQuery = signal('');
  selectedStatus = signal<ReceiptStatus | undefined>(undefined);
  selectedReceipt = signal<Receipt | null>(null);
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
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const search = params['search'] || '';
      this.currentPage.set(page);
      this.pageSize.set(PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0]);
      this.searchQuery.set(search === '-' ? '' : search);
      this.loadReceipts();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  loadReceipts() {
    this.loading.set(true);
    this.wmsService
      .getReceipts({
        page: this.currentPage(),
        limit: this.pageSize(),
        status: this.selectedStatus(),
      })
      .subscribe({
        next: (result) => {
          this.receipts.set(result.items);
          this.totalRecords.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected refresh() {
    this.loadReceipts();
  }

  protected onStatusChange(status: ReceiptStatus | undefined) {
    this.selectedStatus.set(status);
    this.loadReceipts();
  }

  protected openDetail(receipt: Receipt) {
    this.selectedReceipt.set(receipt);
    this.drawerVisible.set(true);
  }

  protected closeDrawer() {
    this.drawerVisible.set(false);
    this.selectedReceipt.set(null);
  }

  protected getStatusSeverity(
    status: ReceiptStatus,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<ReceiptStatus, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      [ReceiptStatus.COMPLETED]: 'success',
      [ReceiptStatus.QC_PASSED]: 'success',
      [ReceiptStatus.PARTIAL]: 'warn',
      [ReceiptStatus.QC_PENDING]: 'warn',
      [ReceiptStatus.QC_FAILED]: 'danger',
      [ReceiptStatus.CANCELLED]: 'danger',
      [ReceiptStatus.PENDING]: 'info',
      [ReceiptStatus.RECEIVED]: 'info',
      [ReceiptStatus.DRAFT]: 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  private navigateWithState(page?: number): void {
    const search = this.searchQuery() || '-';
    const p = page ?? this.currentPage();
    this.router.navigate(['../../..', search, p, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }
}
