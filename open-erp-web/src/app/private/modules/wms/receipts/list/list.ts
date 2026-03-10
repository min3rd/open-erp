import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
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
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import {
  WmsService,
  Receipt,
  ReceiptStatus,
  ReceiptType,
  AuditEntry,
} from '../../../../../../core/services/wms/wms.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';
import { Subject, takeUntil } from 'rxjs';
import { combineLatest } from 'rxjs';

interface ColumnDef {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
}

@Component({
  selector: 'receipt-list',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    TabsModule,
    TextareaModule,
    DatePickerModule,
    DividerModule,
    TimelineModule,
    MpToolbar,
    RouterOutlet,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptList implements OnInit, OnDestroy {
  private readonly wmsService = inject(WmsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;
  protected readonly ReceiptStatus = ReceiptStatus;
  protected readonly ReceiptType = ReceiptType;

  protected readonly columnOptions: ColumnDef[] = [
    { field: 'code', header: 'wms.receipts.code', sortable: true, width: '140px' },
    { field: 'poId', header: 'wms.receipts.poId', sortable: true, width: '140px' },
    { field: 'supplier', header: 'wms.receipts.supplier', sortable: true },
    { field: 'type', header: 'wms.receipts.type', sortable: true, width: '110px' },
    { field: 'lines', header: 'wms.receipts.lines', sortable: false, width: '80px' },
    { field: 'status', header: 'wms.receipts.status', sortable: true, width: '130px' },
    { field: 'createdAt', header: 'wms.receipts.createdAt', sortable: true, width: '150px' },
  ];
  protected selectedColumns: ColumnDef[] = [...this.columnOptions];

  protected readonly statusOptions = Object.values(ReceiptStatus).map((s) => ({
    label: s,
    value: s,
  }));

  protected readonly typeOptions = Object.values(ReceiptType).map((t) => ({
    label: t,
    value: t,
  }));

  receipts = signal<Receipt[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  searchQuery = signal('');
  selectedStatus = signal<ReceiptStatus | undefined>(undefined);
  sortField = signal<string>('createdAt');
  sortOrder = signal<number>(-1);
  selectedReceipt = signal<Receipt | null>(null);
  detailDrawerVisible = signal(false);
  actionDrawerVisible = signal(false);
  actionType = signal<'submit' | 'approve' | 'receive' | 'finalize' | null>(null);
  auditTrail = signal<AuditEntry[]>([]);
  actionLoading = signal(false);
  isMobile = signal(false);
  activeTab = signal(0);

  actionForm!: FormGroup;

  private resizeHandler: (() => void) | null = null;

  constructor() {
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }
    this.initForms();
  }

  private initForms() {
    this.actionForm = this.fb.group({
      notes: [''],
      action: ['accept'],
      reason: [''],
    });
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
        if (queryParams['status']) this.selectedStatus.set(queryParams['status'] as ReceiptStatus);
        if (queryParams['sortField']) this.sortField.set(queryParams['sortField']);
        if (queryParams['sortOrder']) this.sortOrder.set(parseInt(queryParams['sortOrder'], 10));
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
        q: this.searchQuery() || undefined,
        sortField: this.sortField(),
        sortOrder: this.sortOrder() as 1 | -1,
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

  protected onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value || '-';
    this.searchQuery.set(value === '-' ? '' : value);
    this.navigateWithState(1);
  }

  protected onStatusChange(status: ReceiptStatus | undefined) {
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

  protected openDetail(receipt: Receipt) {
    this.selectedReceipt.set(receipt);
    this.activeTab.set(0);
    this.detailDrawerVisible.set(true);
    this.loadAuditTrail(receipt.id);
  }

  protected openDetailRoute(receipt: Receipt) {
    this.router.navigate([receipt.id, 'view'], { relativeTo: this.route });
  }

  protected loadAuditTrail(id: string) {
    this.wmsService.getReceiptAudit(id).subscribe({
      next: (entries) => this.auditTrail.set(entries),
      error: () => this.auditTrail.set([]),
    });
  }

  protected closeDetailDrawer() {
    this.detailDrawerVisible.set(false);
    this.selectedReceipt.set(null);
  }

  protected navigateToCreate() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  protected onChildDeactivated() {
    this.loadReceipts();
  }

  protected openActionDrawer(
    receipt: Receipt,
    type: 'submit' | 'approve' | 'receive' | 'finalize',
  ) {
    this.selectedReceipt.set(receipt);
    this.actionType.set(type);
    this.actionForm.reset({ notes: '', action: 'accept', reason: '' });
    this.actionDrawerVisible.set(true);
  }

  protected closeActionDrawer() {
    this.actionDrawerVisible.set(false);
    this.actionType.set(null);
  }

  protected submitAction() {
    const receipt = this.selectedReceipt();
    const type = this.actionType();
    if (!receipt || !type) return;

    this.actionLoading.set(true);
    const notes = this.actionForm.value.notes || undefined;
    let obs$;

    switch (type) {
      case 'submit':
        obs$ = this.wmsService.submitReceipt(receipt.id, { notes });
        break;
      case 'approve':
        obs$ = this.wmsService.approveReceipt(receipt.id, { notes });
        break;
      case 'receive':
        // Receive with existing lines - partial receive starting from 0
        obs$ = this.wmsService.receiveReceipt(receipt.id, {
          lines:
            receipt.lines?.map((l) => ({
              lineId: l.lineId,
              skuId: l.skuId,
              receivedQty: l.orderedQty - (l.receivedQty || 0),
            })) ?? [],
        });
        break;
      case 'finalize':
        obs$ = this.wmsService.finalizeReceipt(receipt.id, { notes });
        break;
      default:
        this.actionLoading.set(false);
        return;
    }

    obs$.subscribe({
      next: (updatedReceipt) => {
        this.actionLoading.set(false);
        this.actionDrawerVisible.set(false);
        this.loadReceipts();
        if (this.detailDrawerVisible() && updatedReceipt) {
          this.selectedReceipt.set(updatedReceipt);
          this.loadAuditTrail(updatedReceipt.id);
        }
      },
      error: () => this.actionLoading.set(false),
    });
  }

  protected canSubmit(receipt: Receipt): boolean {
    return receipt.status === ReceiptStatus.DRAFT;
  }

  protected canApprove(receipt: Receipt): boolean {
    return (
      receipt.status === ReceiptStatus.UNDER_REVIEW || receipt.status === ReceiptStatus.PENDING
    );
  }

  protected canReceive(receipt: Receipt): boolean {
    return receipt.status === ReceiptStatus.APPROVED || receipt.status === ReceiptStatus.PARTIAL;
  }

  protected canFinalize(receipt: Receipt): boolean {
    return (
      receipt.status === ReceiptStatus.RECEIVED ||
      receipt.status === ReceiptStatus.QC_PASSED ||
      receipt.status === ReceiptStatus.COMPLETED
    );
  }

  protected isLocked(receipt: Receipt): boolean {
    return !!receipt.lockedAt || receipt.status === ReceiptStatus.FINALIZED;
  }

  protected getStatusSeverity(
    status: ReceiptStatus,
  ): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' {
    const map: Record<
      ReceiptStatus,
      'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast'
    > = {
      [ReceiptStatus.COMPLETED]: 'success',
      [ReceiptStatus.QC_PASSED]: 'success',
      [ReceiptStatus.FINALIZED]: 'success',
      [ReceiptStatus.APPROVED]: 'info',
      [ReceiptStatus.UNDER_REVIEW]: 'info',
      [ReceiptStatus.PARTIAL]: 'warn',
      [ReceiptStatus.QC_PENDING]: 'warn',
      [ReceiptStatus.QC_FAILED]: 'danger',
      [ReceiptStatus.CANCELLED]: 'danger',
      [ReceiptStatus.REJECTED]: 'danger',
      [ReceiptStatus.PENDING]: 'info',
      [ReceiptStatus.RECEIVED]: 'success',
      [ReceiptStatus.DRAFT]: 'secondary',
    };
    return map[status] ?? 'secondary';
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

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }
}
