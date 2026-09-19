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
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpToggleComponent,
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';

@Component({
  selector: 'app-user-assignment-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpToggleComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './user-assignment-drawer.component.html'
})
export class UserAssignmentDrawerComponent {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  membership = input<Membership | null>(null);
  branches = input<Branch[]>([]);
  departments = input<FlatDepartmentNode[]>([]);
  members = input<Membership[]>([]);

  close = output<void>();
  saved = output<string>();

  readonly userId = signal<string>('');
  readonly branchId = signal<string>('');
  readonly departmentId = signal<string>('');
  readonly managerUserId = signal<string>('');
  readonly title = signal<string>('');
  readonly isPrimary = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  readonly branchOptions = computed<SelectOption[]>(() =>
    this.branches().map((branch) => ({ value: branch.id, label: `${branch.code} - ${branch.name}` }))
  );

  readonly departmentOptions = computed<SelectOption[]>(() =>
    this.departments().map((department) => ({
      value: department.id,
      label: `${'-- '.repeat(department.depth)}${department.code} - ${department.name}`
    }))
  );

  readonly managerOptions = computed<SelectOption[]>(() => [
    { value: '', labelKey: 'ORGANIZATION_USER_ASSIGN_NO_MANAGER' },
    ...this.members().map((member) => ({
      value: member.user_id,
      label: `${member.user_full_name || member.user_email} (${member.user_email})`
    }))
  ]);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const editing = this.membership();
        this.userId.set(editing?.user_id || '');
        this.branchId.set(editing?.branch_id || '');
        this.departmentId.set(editing?.department_id || '');
        this.managerUserId.set(editing?.direct_manager_user_id || '');
        this.title.set(editing?.title || '');
        this.isPrimary.set(editing?.is_primary ?? true);
        this.errorText.set('');
      }
    });
  }

  get isEditing(): boolean {
    return !!this.membership();
  }

  onClose() {
    this.close.emit();
  }

  submit() {
    if (!this.userId().trim() || !this.branchId() || !this.departmentId()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    const payload = {
      user_id: this.userId().trim(),
      branch_id: this.branchId(),
      department_id: this.departmentId(),
      direct_manager_user_id: this.managerUserId() || null,
      title: this.title().trim() || undefined,
      is_primary: this.isPrimary()
    };
    const editing = this.membership();
    this.saving.set(true);
    const request = editing
      ? this.organization.updateMembership(editing.id, payload)
      : this.organization.createMembership(payload);
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
