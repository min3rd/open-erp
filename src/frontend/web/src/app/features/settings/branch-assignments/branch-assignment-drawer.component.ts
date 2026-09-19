import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ApiErrorResponse,
  Branch,
  BranchAssignment,
  DrawerComponent,
  I18nService,
  SharpButtonComponent,
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';

@Component({
  selector: 'app-branch-assignment-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, DrawerComponent, SharpButtonComponent, TranslatePipe],
  templateUrl: './branch-assignment-drawer.component.html'
})
export class BranchAssignmentDrawerComponent {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  userId = input<string>('');
  userEmail = input<string>('');
  branches = input<Branch[]>([]);

  close = output<void>();
  saved = output<string>();

  readonly assignments = signal<BranchAssignment[]>([]);
  readonly selectedBranchIds = signal<Set<string>>(new Set<string>());
  readonly primaryBranchId = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen() && this.userId()) {
        this.reload(this.userId());
      }
      if (!this.isOpen()) {
        this.assignments.set([]);
        this.selectedBranchIds.set(new Set<string>());
        this.primaryBranchId.set('');
        this.errorText.set('');
      }
    });
  }

  isSelected(branchId: string): boolean {
    return this.selectedBranchIds().has(branchId);
  }

  toggleBranch(branchId: string, checked: boolean) {
    const next = new Set(this.selectedBranchIds());
    if (checked) {
      next.add(branchId);
    } else {
      next.delete(branchId);
      if (this.primaryBranchId() === branchId) {
        this.primaryBranchId.set('');
      }
    }
    this.selectedBranchIds.set(next);
  }

  setPrimary(branchId: string) {
    const next = new Set(this.selectedBranchIds());
    next.add(branchId);
    this.selectedBranchIds.set(next);
    this.primaryBranchId.set(branchId);
  }

  onClose() {
    this.close.emit();
  }

  async save() {
    const userId = this.userId();
    if (!userId) {
      return;
    }
    if (this.selectedBranchIds().size > 0 && !this.primaryBranchId()) {
      this.errorText.set(this.i18n.t('ORGANIZATION_BRANCH_ASSIGNMENT_PRIMARY_REQUIRED'));
      return;
    }
    this.saving.set(true);
    try {
      const current = this.assignments();
      const existing = new Map(current.map((assignment) => [assignment.branch_id, assignment]));
      const selectedIds = this.selectedBranchIds();
      const primaryBranch = this.primaryBranchId();
      const oldPrimary = current.find((assignment) => assignment.is_primary);

      if (oldPrimary && oldPrimary.branch_id !== primaryBranch && selectedIds.has(oldPrimary.branch_id)) {
        await firstValueFrom(
          this.organization.updateBranchAssignment(oldPrimary.id, { is_primary: false, can_manage: true })
        );
      }

      for (const branchId of selectedIds) {
        if (!existing.has(branchId)) {
          await firstValueFrom(
            this.organization.createBranchAssignment({
              user_id: userId,
              branch_id: branchId,
              is_primary: branchId === primaryBranch,
              can_manage: true
            })
          );
        }
      }

      for (const branchId of selectedIds) {
        const assignment = existing.get(branchId);
        if (assignment && assignment.is_primary !== (branchId === primaryBranch)) {
          await firstValueFrom(
            this.organization.updateBranchAssignment(assignment.id, {
              is_primary: branchId === primaryBranch,
              can_manage: true
            })
          );
        }
      }

      for (const assignment of current) {
        if (!selectedIds.has(assignment.branch_id)) {
          await firstValueFrom(this.organization.deleteBranchAssignment(assignment.id));
        }
      }

      this.saving.set(false);
      this.saved.emit('ORGANIZATION_BRANCH_ASSIGNMENT_UPDATED');
    } catch (err) {
      this.saving.set(false);
      this.showError(err);
    }
  }

  private reload(userId: string) {
    this.loading.set(true);
    this.organization.getBranchAssignments({ user_id: userId }).subscribe({
      next: (res) => {
        this.assignments.set(res.data.items);
        this.selectedBranchIds.set(new Set(res.data.items.map((assignment) => assignment.branch_id)));
        const primary = res.data.items.find((assignment) => assignment.is_primary);
        this.primaryBranchId.set(primary?.branch_id || '');
        this.loading.set(false);
        this.errorText.set('');
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
