import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApiErrorResponse,
  BadgeComponent,
  Branch,
  ColorVariant,
  DepartmentNode,
  FlatDepartmentNode,
  I18nService,
  Membership,
  PaginationComponent,
  SampleRecord,
  SampleRecordStatus,
  TableColumn,
  TableComponent,
  TranslatePipe,
  formatDateTime
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
import { SampleRecordService } from '../../../core/services/sample-record.service';
import { ListRouteState, RouteListStateService } from '../../../core/utils/route-list-state.service';
import { SampleRecordFormDrawerComponent } from './sample-record-form-drawer.component';

@Component({
  selector: 'app-sample-record-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    PaginationComponent,
    BadgeComponent,
    TranslatePipe,
    SampleRecordFormDrawerComponent
  ],
  providers: [RouteListStateService],
  templateUrl: './sample-record-list.component.html'
})
export class SampleRecordListComponent implements OnInit {
  private sampleRecords = inject(SampleRecordService);
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);
  private routeState = inject(RouteListStateService);

  readonly records = signal<SampleRecord[]>([]);
  readonly formatDateTime = formatDateTime;
  readonly branches = signal<Branch[]>([]);
  readonly departments = signal<FlatDepartmentNode[]>([]);
  readonly members = signal<Membership[]>([]);
  readonly loading = signal<boolean>(false);
  readonly page = signal<number>(0);
  readonly size = signal<number>(20);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');
  readonly exportUrl = signal<string>('');
  readonly exportDenied = signal<boolean>(false);
  readonly exportDeniedKey = signal<string>('IAM_PERMISSION_DENIED_EXPORT');
  readonly exporting = signal<boolean>(false);

  readonly drawerOpen = signal<boolean>(false);
  readonly editingRecord = signal<SampleRecord | null>(null);

  readonly confirmDelete = signal<SampleRecord | null>(null);
  readonly deleting = signal<boolean>(false);

  private loadedListKey = '';
  private currentState: ListRouteState | null = null;

  readonly columns: TableColumn[] = [
    { key: 'title', labelKey: 'SAMPLE_RECORD_COL_TITLE' },
    { key: 'amount', labelKey: 'SAMPLE_RECORD_COL_AMOUNT', align: 'right' },
    { key: 'status', labelKey: 'SAMPLE_RECORD_COL_STATUS' },
    { key: 'branch', labelKey: 'SAMPLE_RECORD_COL_BRANCH' },
    { key: 'department', labelKey: 'SAMPLE_RECORD_COL_DEPARTMENT' },
    { key: 'assignee', labelKey: 'SAMPLE_RECORD_COL_ASSIGNEE' },
    { key: 'created_at', labelKey: 'SAMPLE_RECORD_COL_CREATED_AT' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  readonly statusOptions = computed(() => [
    { value: SampleRecordStatus.ACTIVE, labelKey: 'SAMPLE_RECORD_STATUS_ACTIVE' },
    { value: SampleRecordStatus.ARCHIVED, labelKey: 'SAMPLE_RECORD_STATUS_ARCHIVED' }
  ]);

  ngOnInit() {
    this.loadReferenceData();
    this.routeState.bind((state) => this.applyState(state));
  }

  private applyState(state: ListRouteState): void {
    this.page.set(state.page);
    this.size.set(state.size);
    this.currentState = state;
    const listKey = this.routeState.listKey(state);
    if (listKey !== this.loadedListKey) {
      this.loadedListKey = listKey;
      this.load();
    }
    this.applySelection(state);
  }

  private applySelection(state: ListRouteState): void {
    const record = state.id ? this.records().find((item) => item.id === state.id) ?? null : null;
    this.editingRecord.set(state.drawer === 'edit' ? record : null);
    this.confirmDelete.set(state.drawer === 'delete' ? record : null);
    this.drawerOpen.set(state.drawer === 'create' || (state.drawer === 'edit' && !!record));
  }

  load() {
    this.loading.set(true);
    this.sampleRecords.getSampleRecords({ page: this.page(), size: this.size() }).subscribe({
      next: (res) => {
        this.records.set(res.data.items);
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

  changePage(nextPage: number) {
    this.routeState.set({ page: nextPage });
  }

  statusVariant(status: string): ColorVariant {
    return status === SampleRecordStatus.ACTIVE ? ColorVariant.SUCCESS : ColorVariant.DEFAULT;
  }

  openCreate() {
    this.routeState.set({ drawer: 'create', id: null });
  }

  openEdit(record: SampleRecord) {
    this.routeState.set({ drawer: 'edit', id: record.id });
  }

  closeDrawer() {
    this.routeState.set({ drawer: null, id: null });
  }

  onSaved(code: string) {
    this.routeState.set({ drawer: null, id: null });
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  askDelete(record: SampleRecord) {
    this.routeState.set({ drawer: 'delete', id: record.id });
  }

  cancelDelete() {
    this.routeState.set({ drawer: null, id: null });
  }

  confirmDeleteRecord() {
    const target = this.confirmDelete();
    if (!target) {
      return;
    }
    this.deleting.set(true);
    this.sampleRecords.deleteSampleRecord(target.id).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.routeState.set({ drawer: null, id: null });
        this.successText.set(this.i18n.t(res.code, res.params));
        this.errorText.set('');
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.showError(err);
      }
    });
  }

  exportRecords() {
    this.exporting.set(true);
    this.exportUrl.set('');
    this.sampleRecords.exportSampleRecords().subscribe({
      next: (res) => {
        this.exporting.set(false);
        this.successText.set(this.i18n.t(res.code, res.params));
        this.exportUrl.set(res.data?.download_url || res.data?.file_url || '');
        this.errorText.set('');
      },
      error: (err) => {
        this.exporting.set(false);
        const apiError = err as ApiErrorResponse;
        if (apiError?.code === 'IAM_PERMISSION_DENIED_EXPORT' || apiError?.code === 'SUPERADMIN_IMPERSONATION_SECRET_EXPORT_FORBIDDEN') {
          this.exportDenied.set(true);
          this.exportDeniedKey.set(apiError.code);
        }
        this.showError(err);
      }
    });
  }

  private loadReferenceData() {
    forkJoin({
      branches: this.organization.getBranches(),
      departments: this.organization.getDepartmentTree(),
      members: this.organization.getMemberships()
    }).subscribe({
      next: ({ branches, departments, members }) => {
        this.branches.set(branches.data.items);
        this.departments.set(this.flatten(departments.data.items, 0, []));
        this.members.set(members.data.items);
      },
      error: () => {
        this.branches.set([]);
        this.departments.set([]);
        this.members.set([]);
      }
    });
  }

  private flatten(nodes: DepartmentNode[], depth: number, acc: FlatDepartmentNode[]): FlatDepartmentNode[] {
    for (const node of nodes) {
      acc.push({ ...node, depth });
      if (node.children?.length) {
        this.flatten(node.children, depth + 1, acc);
      }
    }
    return acc;
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
    this.successText.set('');
  }
}
