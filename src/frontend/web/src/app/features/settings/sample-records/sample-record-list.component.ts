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
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
import { SampleRecordService } from '../../../core/services/sample-record.service';
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
  templateUrl: './sample-record-list.component.html'
})
export class SampleRecordListComponent implements OnInit {
  private sampleRecords = inject(SampleRecordService);
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  readonly records = signal<SampleRecord[]>([]);
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
  readonly exporting = signal<boolean>(false);

  readonly drawerOpen = signal<boolean>(false);
  readonly editingRecord = signal<SampleRecord | null>(null);

  readonly confirmDelete = signal<SampleRecord | null>(null);
  readonly deleting = signal<boolean>(false);

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
    this.load();
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
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  changePage(nextPage: number) {
    this.page.set(nextPage);
    this.load();
  }

  statusVariant(status: string): ColorVariant {
    return status === SampleRecordStatus.ACTIVE ? ColorVariant.SUCCESS : ColorVariant.DEFAULT;
  }

  openCreate() {
    this.editingRecord.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(record: SampleRecord) {
    this.editingRecord.set(record);
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }

  onSaved(code: string) {
    this.drawerOpen.set(false);
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  askDelete(record: SampleRecord) {
    this.confirmDelete.set(record);
  }

  cancelDelete() {
    this.confirmDelete.set(null);
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
        this.confirmDelete.set(null);
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
        if (apiError?.code === 'IAM_PERMISSION_DENIED_EXPORT') {
          this.exportDenied.set(true);
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
