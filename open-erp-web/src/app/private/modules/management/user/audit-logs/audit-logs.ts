import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// PrimeNG imports
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

// Services and types
import {
  UserDetailService,
  UserDetail,
  UserActivityLog,
} from '../services/user-detail.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constant';

@Component({
  selector: 'management-user-audit-logs',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    SkeletonModule,
    DrawerModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    InputGroupModule,
    InputGroupAddonModule,
  ],
  templateUrl: './audit-logs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogs implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  protected readonly user = signal<UserDetail | null>(null);
  protected readonly activityLogs = signal<UserActivityLog[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly searchQuery = signal('');
  protected readonly sortField = signal<string>('timestamp');
  protected readonly sortOrder = signal<'asc' | 'desc'>('desc');
  protected readonly isMobile = signal(false);
  
  // Detail drawer
  protected readonly selectedLog = signal<UserActivityLog | null>(null);
  protected readonly isDetailDrawerOpen = signal(false);
  protected readonly isLoadingDetail = signal(false);

  // Computed
  protected readonly totalPages = computed(() =>
    Math.ceil(this.totalRecords() / this.pageSize())
  );

  // Page size options for dropdown
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  constructor() {
    // Detect mobile viewport
    this.checkViewport();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkViewport());
    }
  }

  ngOnInit(): void {
    // Get user from parent route resolver
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        const userData = data['userDetail'] as UserDetail;
        this.user.set(userData);
      }
    });

    // Get activity logs from route resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['activityLogs']) {
        const logsData = data['activityLogs'];
        this.activityLogs.set(logsData.data || []);
        this.currentPage.set(logsData.page || 1);
        this.totalRecords.set(logsData.total || 0);
      }
    });

    // Setup search debouncing
    this.searchSubject$
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.currentPage.set(1);
        this.loadActivityLogs();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check viewport size to detect mobile
   */
  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  /**
   * Load user activity logs
   */
  private loadActivityLogs(): void {
    const userData = this.user();
    if (!userData) return;

    this.isLoading.set(true);

    this.userDetailService
      .getUserActivityLogs(
        userData.id,
        this.currentPage(),
        this.pageSize(),
        this.searchQuery() || undefined,
        this.sortField(),
        this.sortOrder()
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.activityLogs.set(response.data || []);
          this.totalRecords.set(response.total || 0);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load activity logs:', error);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Handle table lazy load event
   */
  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const page = event.first !== undefined && event.rows ? Math.floor(event.first / event.rows) + 1 : 1;
    const rows = event.rows || this.pageSize();
    
    this.currentPage.set(page);
    this.pageSize.set(rows);

    // Handle sorting
    if (event.sortField) {
      this.sortField.set(event.sortField as string);
      this.sortOrder.set(event.sortOrder === 1 ? 'asc' : 'desc');
    }

    this.loadActivityLogs();
  }

  /**
   * Handle search input
   */
  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject$.next(value);
  }

  /**
   * Handle page change
   */
  protected onPageChange(newPage: number): void {
    this.currentPage.set(newPage);
    this.loadActivityLogs();
  }

  /**
   * Handle page size change
   */
  protected onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    this.loadActivityLogs();
  }

  /**
   * Open audit log detail drawer
   */
  protected onViewDetail(log: UserActivityLog): void {
    this.isLoadingDetail.set(true);
    this.isDetailDrawerOpen.set(true);
    
    // Fetch full log details
    this.userDetailService
      .getAuditLogDetail(log.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailLog) => {
          this.selectedLog.set(detailLog);
          this.isLoadingDetail.set(false);
        },
        error: (error) => {
          console.error('Failed to load log detail:', error);
          // Fallback to showing the existing log data
          this.selectedLog.set(log);
          this.isLoadingDetail.set(false);
        },
      });
  }

  /**
   * Close detail drawer
   */
  protected onCloseDetail(): void {
    this.isDetailDrawerOpen.set(false);
    this.selectedLog.set(null);
  }

  /**
   * Get status severity for tag
   */
  protected getStatusSeverity(status?: string): 'success' | 'danger' | 'secondary' {
    if (status === 'success') return 'success';
    if (status === 'failure') return 'danger';
    return 'secondary';
  }

  /**
   * Format timestamp for display
   */
  protected formatTimestamp(timestamp?: string): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Format date only
   */
  protected formatDate(timestamp?: string): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }

  /**
   * Format time only
   */
  protected formatTime(timestamp?: string): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  /**
   * Stringify JSON for display
   */
  protected stringifyJson(obj: any): string {
    if (!obj) return '-';
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  /**
   * Helper for Object.keys in template
   */
  protected readonly Object = Object;
}

