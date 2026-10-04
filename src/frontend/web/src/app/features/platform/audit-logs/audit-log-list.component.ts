import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  TranslatePipe,
  auditResultVariant,
  formatDateTime
} from '@shared';
import { PlatformService } from '../../../core/services/platform.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';
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
  providers: [PathListStateService],
  templateUrl: './audit-log-list.component.html'
})
export class AuditLogListComponent implements OnInit {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private listState = inject(PathListStateService);

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal<boolean>(false);
  readonly formatDateTime = formatDateTime;
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

  private loadedListKey = '';
  private currentState: PathListState | null = null;

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
    this.listState.bind('/platform/audit-logs', (state, keyword) => this.applyState(state, keyword));
  }

  private applyState(state: PathListState, keyword: string): void {
    const query = this.route.snapshot.queryParamMap;
    const result = query.get('result') ?? '';
    const action = query.get('action') ?? '';
    const from = query.get('from') ?? '';
    const to = query.get('to') ?? '';

    this.page.set(state.page - 1);
    this.size.set(state.pageSize);
    this.keyword.set(keyword);
    this.scopeFilter.set(state.filter === 'all' ? '' : state.filter);
    this.resultFilter.set(result);
    this.actionFilter.set(action);
    this.fromDate.set(from);
    this.toDate.set(to);
    this.currentState = state;

    const listKey = this.listState.listKey(state) + '|' + [result, action, from, to].join('|');
    if (listKey !== this.loadedListKey) {
      this.loadedListKey = listKey;
      this.load();
    }
    this.applySelection(state);
  }

  private applySelection(state: PathListState): void {
    this.detailId.set(state.mode === 'detail' ? state.id : null);
    this.detailOpen.set(state.mode === 'detail' && !!state.id);
  }

  private currentQuery(): Record<string, string | null> {
    const query = this.route.snapshot.queryParamMap;
    return {
      result: query.get('result'),
      action: query.get('action'),
      from: query.get('from'),
      to: query.get('to')
    };
  }

  private inputQuery(): Record<string, string | null> {
    return {
      result: this.resultFilter() || null,
      action: this.actionFilter() || null,
      from: this.fromDate() || null,
      to: this.toDate() || null
    };
  }

  private updateState(patch: Partial<PathListState>, keyword?: string | null,
                      extraQuery?: Record<string, string | null>): void {
    this.listState.set(patch, keyword, extraQuery);
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
          if (this.currentState) {
            this.applySelection(this.currentState);
          }
        },
        error: (err) => {
          this.loading.set(false);
          this.showError(err);
        }
      });
  }

  onScopeChange(value: string) {
    this.updateState({ filter: value || 'all', page: 1, id: null, mode: 'list' }, this.keyword(), this.inputQuery());
  }

  onResultChange(value: string) {
    this.updateState({ page: 1, id: null, mode: 'list' }, this.keyword(), { ...this.inputQuery(), result: value || null });
  }

  applyFilters() {
    this.updateState({ page: 1, id: null, mode: 'list' }, this.keyword(), this.inputQuery());
  }

  resetFilters() {
    this.updateState({ filter: 'all', sort: '-', pageSize: 20, page: 1, id: null, mode: 'list' }, '',
      { result: null, action: null, from: null, to: null });
  }

  changePage(nextPage: number) {
    this.updateState({ page: nextPage + 1 }, this.keyword(), this.currentQuery());
  }

  openDetail(log: AuditLog) {
    this.updateState({ mode: 'detail', id: log.log_id }, this.keyword(), this.currentQuery());
  }

  closeDetail() {
    this.updateState({ mode: 'list', id: null }, this.keyword(), this.currentQuery());
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

  readonly resultVariant = auditResultVariant;

  shortCorrelation(correlationId: string): string {
    return correlationId ? correlationId.substring(0, 8) : '-';
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
