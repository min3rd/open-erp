import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  AuditLog,
  AuditResult,
  AuditScope,
  BadgeComponent,
  ColorVariant,
  I18nService,
  PaginationComponent,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TableColumn,
  TableComponent,
  TranslatePipe
} from '@shared';
import { PlatformService } from '../../../core/services/platform.service';
import { AuditLogDetailDrawerComponent } from './audit-log-detail-drawer.component';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    PaginationComponent,
    BadgeComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    TranslatePipe,
    AuditLogDetailDrawerComponent
  ],
  templateUrl: './audit-log-list.component.html'
})
export class AuditLogListComponent implements OnInit {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal<boolean>(false);
  readonly page = signal<number>(0);
  readonly size = signal<number>(20);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly errorText = signal<string>('');

  readonly scopeFilter = signal<string>('');
  readonly resultFilter = signal<string>('');
  readonly actionFilter = signal<string>('');
  readonly fromDate = signal<string>('');
  readonly toDate = signal<string>('');
  readonly keyword = signal<string>('');

  readonly detailId = signal<string | null>(null);
  readonly detailOpen = signal<boolean>(false);

  readonly columns: TableColumn[] = [
    { key: 'created_at', labelKey: 'PLATFORM_AUDIT_COL_TIME' },
    { key: 'actor', labelKey: 'PLATFORM_AUDIT_COL_ACTOR' },
    { key: 'action', labelKey: 'PLATFORM_AUDIT_COL_ACTION' },
    { key: 'scope', labelKey: 'PLATFORM_AUDIT_COL_SCOPE' },
    { key: 'result', labelKey: 'PLATFORM_AUDIT_COL_RESULT' },
    { key: 'correlation', labelKey: 'PLATFORM_AUDIT_COL_CORRELATION' },
    { key: 'target', labelKey: 'PLATFORM_AUDIT_COL_TARGET' },
    { key: 'ip', labelKey: 'PLATFORM_AUDIT_COL_IP' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  readonly scopeOptions: SelectOption[] = [
    { value: '', labelKey: 'COMMON_ALL' },
    { value: AuditScope.PLATFORM, labelKey: 'AUDIT_SCOPE_PLATFORM' },
    { value: AuditScope.TENANT, labelKey: 'AUDIT_SCOPE_TENANT' }
  ];

  readonly resultOptions: SelectOption[] = [
    { value: '', labelKey: 'COMMON_ALL' },
    { value: AuditResult.SUCCESS, labelKey: 'AUDIT_RESULT_SUCCESS' },
    { value: AuditResult.DENIED, labelKey: 'AUDIT_RESULT_DENIED' },
    { value: AuditResult.FAILED, labelKey: 'AUDIT_RESULT_FAILED' }
  ];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.platform
      .getAuditLogs({
        page: this.page(),
        size: this.size(),
        scope: this.scopeFilter(),
        result: this.resultFilter(),
        action: this.actionFilter(),
        from_date: this.fromDate(),
        to_date: this.toDate(),
        keyword: this.keyword()
      })
      .subscribe({
        next: (res) => {
          this.logs.set(res.data.items);
          this.totalItems.set(res.data.total_items);
          this.totalPages.set(res.data.total_pages);
          this.loading.set(false);
          this.errorText.set('');
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err);
        }
      });
  }

  applyFilters() {
    this.page.set(0);
    this.load();
  }

  resetFilters() {
    this.scopeFilter.set('');
    this.resultFilter.set('');
    this.actionFilter.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.keyword.set('');
    this.page.set(0);
    this.load();
  }

  changePage(nextPage: number) {
    this.page.set(nextPage);
    this.load();
  }

  openDetail(log: AuditLog) {
    this.detailId.set(log.log_id);
    this.detailOpen.set(true);
  }

  closeDetail() {
    this.detailOpen.set(false);
  }

  scopeVariant(scope: AuditScope): ColorVariant {
    switch (scope) {
      case AuditScope.PLATFORM:
        return ColorVariant.INFO;
      case AuditScope.TENANT:
        return ColorVariant.DEFAULT;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  resultVariant(result: AuditResult): ColorVariant {
    switch (result) {
      case AuditResult.SUCCESS:
        return ColorVariant.SUCCESS;
      case AuditResult.DENIED:
        return ColorVariant.WARNING;
      case AuditResult.FAILED:
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  shortCorrelation(correlationId: string): string {
    return correlationId ? correlationId.substring(0, 8) : '-';
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
