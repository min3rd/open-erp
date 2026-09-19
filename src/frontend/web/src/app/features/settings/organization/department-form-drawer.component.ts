import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ApiErrorResponse,
  Branch,
  DepartmentNode,
  DrawerComponent,
  FlatDepartmentNode,
  I18nService,
  Membership,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';

@Component({
  selector: 'app-department-form-drawer',
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
  templateUrl: './department-form-drawer.component.html'
})
export class DepartmentFormDrawerComponent {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  department = input<DepartmentNode | null>(null);
  presetParentId = input<string | null>(null);
  branches = input<Branch[]>([]);
  departments = input<FlatDepartmentNode[]>([]);

  close = output<void>();
  saved = output<string>();

  readonly code = signal<string>('');
  readonly name = signal<string>('');
  readonly branchId = signal<string>('');
  readonly parentId = signal<string>('');
  readonly managerUserId = signal<string>('');
  readonly members = signal<Membership[]>([]);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  readonly branchOptions = computed<SelectOption[]>(() => [
    { value: '', labelKey: 'ORGANIZATION_DEPARTMENT_NO_BRANCH' },
    ...this.branches().map((branch) => ({ value: branch.id, label: `${branch.code} - ${branch.name}` }))
  ]);

  readonly managerOptions = computed<SelectOption[]>(() => [
    { value: '', labelKey: 'ORGANIZATION_DEPARTMENT_NO_MANAGER' },
    ...this.members().map((member) => ({
      value: member.user_id,
      label: `${member.user_full_name || member.user_email} (${member.user_email})`
    }))
  ]);

  readonly parentOptions = computed<SelectOption[]>(() => {
    const editing = this.department();
    const options: SelectOption[] = [{ value: '', labelKey: 'ORGANIZATION_DEPARTMENT_NO_PARENT' }];
    let skipDepth = -1;
    for (const node of this.departments()) {
      if (editing && node.id === editing.id) {
        skipDepth = node.depth;
        continue;
      }
      if (skipDepth >= 0 && node.depth > skipDepth) {
        continue;
      }
      skipDepth = -1;
      options.push({ value: node.id, label: `${'-- '.repeat(node.depth)}${node.name}` });
    }
    return options;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const editing = this.department();
        this.code.set(editing?.code || '');
        this.name.set(editing?.name || '');
        this.branchId.set(editing?.branch_id || '');
        this.parentId.set(editing ? editing.parent_id || '' : this.presetParentId() || '');
        this.managerUserId.set(editing?.manager_user_id || '');
        this.errorText.set('');
        this.loadMembers();
      }
    });
  }

  get isEditing(): boolean {
    return !!this.department();
  }

  onClose() {
    this.close.emit();
  }

  async submit() {
    if (!this.code().trim() || !this.name().trim()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    const payload = {
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      branch_id: this.branchId() || null,
      parent_id: this.parentId() || null,
      manager_user_id: this.managerUserId() || null
    };
    const editing = this.department();
    this.saving.set(true);
    try {
      if (editing) {
        await firstValueFrom(this.organization.updateDepartment(editing.id, payload));
        const previousParent = editing.parent_id || '';
        if (previousParent !== (payload.parent_id || '')) {
          await firstValueFrom(this.organization.moveDepartment(editing.id, payload.parent_id));
        }
        this.saving.set(false);
        this.saved.emit('ORGANIZATION_DEPARTMENT_UPDATED');
      } else {
        const res = await firstValueFrom(this.organization.createDepartment(payload));
        this.saving.set(false);
        this.saved.emit(res.code);
      }
    } catch (err) {
      this.saving.set(false);
      this.showError(err);
    }
  }

  private loadMembers() {
    this.organization.getMemberships().subscribe({
      next: (res) => this.members.set(res.data.items),
      error: () => this.members.set([])
    });
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
