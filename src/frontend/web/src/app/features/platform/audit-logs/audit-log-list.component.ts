import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParamMap } from '@angular/router';
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
  formatDateTime
} from '@shared';
import { PlatformService } from '../../../core/services/platform.service';
import { ListRouteState, RouteListStateService } from '../../../core/utils/route-list-state.service';
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
  providers: [RouteListStateService],
  templateUrl: './audit-log-list.component.html'
})
export class AuditLogListComponent implements OnInit {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);
  private routeState = inject(RouteListStateService);

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
  private currentState: ListRouteState | null = null;

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
    this.routeState.bind((state, params) => this.applyState(state, params));
  }

  private applyState(state: ListRouteState, params: ParamMap): void {
    const scope = params.get('scope') ?? '';
    const result = params.get('result') ?? state.status;
    const action = params.get('action') ?? '';
    const from = params.get('from') ?? '';
    const to = params.get('to') ?? '';

    this.page.set(state.page);
    this.size.set(state.size);
    this.keyword.set(state.keyword);
    this.scopeFilter.set(scope);
    this.resultFilter.set(result);
    this.actionFilter.set(action);
    this.fromDate.set(from);
    this.toDate.set(to);
    this.currentState = state;

    const listKey = this.routeState.listKey(state, [scope, result, action, from, to].join('|'));
    if (listKey !== this.loadedListKey) {
      this.loadedListKey = listKey;
      this.load();
    }
    this.applySelection(state);
  }

  private applySelection(state: ListRouteState): void {
    this.detailId.set(state.drawer === 'detail' ? state.id : null);
    this.detailOpen.set(state.drawer === 'detail' && !!state.id);
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
    this.routeState.set({
      scope: value || null,
      page: 0,
      keyword: this.keyword(),
      action: this.actionFilter() || null,
      from: this.fromDate() || null,
      to: this.toDate() || null,
      id: null,
      drawer: null
    });
  }

  onResultChange(value: string) {
    this.routeState.set({
      result: value || null,
      status: null,
      page: 0,
      keyword: this.keyword(),
      action: this.actionFilter() || null,
      from: this.fromDate() || null,
      to: this.toDate() || null,
      id: null,
      drawer: null
    });
  }

  applyFilters() {
    this.routeState.set({
      page: 0,
      keyword: this.keyword(),
      action: this.actionFilter() || null,
      from: this.fromDate() || null,
      to: this.toDate() || null,
      id: null,
      drawer: null
    });
  }

  resetFilters() {
    this.routeState.set({
      page: null,
      size: null,
      keyword: null,
      status: null,
      scope: null,
      result: null,
      action: null,
      from: null,
      to: null,
      id: null,
      drawer: null
    });
  }

  changePage(nextPage: number) {
    this.routeState.set({ page: nextPage });
  }

  openDetail(log: AuditLog) {
    this.routeState.set({ drawer: 'detail', id: log.log_id });
  }

  closeDetail() {
    this.routeState.set({ drawer: null, id: null });
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
