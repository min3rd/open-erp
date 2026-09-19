import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  Branch,
  DrawerComponent,
  FlatDepartmentNode,
  I18nService,
  Membership,
  SampleRecord,
  SampleRecordStatus,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TranslatePipe
} from '@shared';

import { SampleRecordService } from '../../../core/services/sample-record.service';

@Component({
  selector: 'app-sample-record-form-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './sample-record-form-drawer.component.html'
})
export class SampleRecordFormDrawerComponent {
  private sampleRecords = inject(SampleRecordService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  record = input<SampleRecord | null>(null);
  branches = input<Branch[]>([]);
  departments = input<FlatDepartmentNode[]>([]);
  members = input<Membership[]>([]);

  close = output<void>();
  saved = output<string>();

  readonly title = signal<string>('');
  readonly amount = signal<string>('0');
  readonly status = signal<string>(SampleRecordStatus.ACTIVE);
  readonly branchId = signal<string>('');
  readonly departmentId = signal<string>('');
  readonly assigneeId = signal<string>('');
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  readonly statusOptions: SelectOption[] = [
    { value: SampleRecordStatus.ACTIVE, labelKey: 'SAMPLE_RECORD_STATUS_ACTIVE' },
    { value: SampleRecordStatus.ARCHIVED, labelKey: 'SAMPLE_RECORD_STATUS_ARCHIVED' }
  ];

  readonly branchOptions = computed<SelectOption[]>(() => [
    { value: '', labelKey: 'COMMON_NONE' },
    ...this.branches().map((branch) => ({ value: branch.id, label: `${branch.code} - ${branch.name}` }))
  ]);

  readonly departmentOptions = computed<SelectOption[]>(() => [
    { value: '', labelKey: 'COMMON_NONE' },
    ...this.departments().map((department) => ({
      value: department.id,
      label: `${'-- '.repeat(department.depth)}${department.name}`
    }))
  ]);

  readonly assigneeOptions = computed<SelectOption[]>(() => [
    { value: '', labelKey: 'COMMON_NONE' },
    ...this.members().map((member) => ({
      value: member.user_id,
      label: `${member.user_full_name || member.user_email} (${member.user_email})`
    }))
  ]);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const editing = this.record();
        this.title.set(editing?.title || '');
        this.amount.set(editing ? String(editing.amount) : '0');
        this.status.set(editing?.status || SampleRecordStatus.ACTIVE);
        this.branchId.set(editing?.branch_id || '');
        this.departmentId.set(editing?.department_id || '');
        this.assigneeId.set(editing?.assignee_id || '');
        this.errorText.set('');
      }
    });
  }

  get isEditing(): boolean {
    return !!this.record();
  }

  onClose() {
    this.close.emit();
  }

  submit() {
    const amount = Number(this.amount());
    if (!this.title().trim()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      this.errorText.set(this.i18n.t('VALIDATION_INVALID'));
      return;
    }
    const payload = {
      title: this.title().trim(),
      amount,
      status: this.status(),
      branch_id: this.branchId() || null,
      department_id: this.departmentId() || null,
      assignee_id: this.assigneeId() || null
    };
    const editing = this.record();
    this.saving.set(true);
    const request = editing
      ? this.sampleRecords.updateSampleRecord(editing.id, payload)
      : this.sampleRecords.createSampleRecord(payload);
    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.saved.emit(res.code);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }
}
