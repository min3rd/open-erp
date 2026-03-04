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
import { DrawerModule } from 'primeng/drawer';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import {
  WmsService,
  Picklist,
  PicklistStatus,
} from '../../../../../../core/services/wms/wms.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';
import { Subject, takeUntil } from 'rxjs';

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

  protected readonly statusOptions = Object.values(PicklistStatus).map((s) => ({
    label: s,
    value: s,
  }));

  picklists = signal<Picklist[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  currentPage = signal(1);
  pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  selectedStatus = signal<PicklistStatus | undefined>(undefined);
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
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      this.currentPage.set(page);
      this.pageSize.set(PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0]);
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

  protected onStatusChange(status: PicklistStatus | undefined) {
    this.selectedStatus.set(status);
    this.loadPicklists();
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
