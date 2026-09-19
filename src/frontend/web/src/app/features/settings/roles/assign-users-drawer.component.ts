import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  Membership,
  Role,
  SharpButtonComponent,
  SharpInputComponent,
  SharpToggleComponent,
  TranslatePipe,
  UserRoleItem
} from '@shared';

import { IamService } from '../../../core/services/iam.service';
import { OrganizationService } from '../../../core/services/organization.service';

@Component({
  selector: 'app-assign-users-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    SharpInputComponent,
    SharpToggleComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './assign-users-drawer.component.html'
})
export class AssignUsersDrawerComponent {
  private iam = inject(IamService);
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  role = input<Role | null>(null);
  roles = input<Role[]>([]);

  close = output<void>();
  saved = output<string>();

  readonly members = signal<Membership[]>([]);
  readonly userSearch = signal<string>('');
  readonly selectedUserId = signal<string>('');
  readonly userRoles = signal<UserRoleItem[]>([]);
  readonly checkedRoleIds = signal<Set<string>>(new Set<string>());
  readonly loadingUsers = signal<boolean>(false);
  readonly loadingRoles = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.userSearch.set('');
        this.selectedUserId.set('');
        this.userRoles.set([]);
        this.checkedRoleIds.set(new Set<string>());
        this.errorText.set('');
        this.loadMembers();
      }
    });
  }

  filteredMembers(): Membership[] {
    const term = this.userSearch().trim().toLowerCase();
    if (!term) {
      return this.members();
    }
    return this.members().filter((member) => {
      const email = (member.user_email || '').toLowerCase();
      const name = (member.user_full_name || '').toLowerCase();
      return email.includes(term) || name.includes(term);
    });
  }

  rolesForSaving(): { item: Role; checked: boolean }[] {
    const checked = this.checkedRoleIds();
    return this.roles().map((item) => ({ item, checked: checked.has(item.id) }));
  }

  selectUser(userId: string) {
    if (!userId) {
      return;
    }
    this.selectedUserId.set(userId);
    this.loadingRoles.set(true);
    this.iam.getUserRoles(userId).subscribe({
      next: (res) => {
        this.userRoles.set(res.data.items);
        const ids = new Set(res.data.items.map((item) => item.role_id));
        const contextRole = this.role();
        if (contextRole && this.roles().some((item) => item.id === contextRole.id)) {
          ids.add(contextRole.id);
        }
        this.checkedRoleIds.set(ids);
        this.loadingRoles.set(false);
      },
      error: (err) => {
        this.loadingRoles.set(false);
        this.showError(err);
      }
    });
  }

  toggleRole(roleId: string, checked: boolean) {
    const next = new Set(this.checkedRoleIds());
    if (checked) {
      next.add(roleId);
    } else {
      next.delete(roleId);
    }
    this.checkedRoleIds.set(next);
  }

  async save() {
    const userId = this.selectedUserId();
    if (!userId) {
      this.errorText.set(this.i18n.t('IAM_ASSIGN_USERS_SELECT_USER'));
      return;
    }
    const currentIds = new Set(this.userRoles().map((item) => item.role_id));
    const checked = this.checkedRoleIds();
    const toAssign = Array.from(checked).filter((id) => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter((id) => !checked.has(id));

    this.saving.set(true);
    try {
      if (toAssign.length) {
        await firstValueFrom(this.iam.assignUserRoles(userId, toAssign));
      }
      for (const roleId of toRemove) {
        await firstValueFrom(this.iam.removeUserRole(userId, roleId));
      }
      this.saving.set(false);
      this.saved.emit('IAM_USER_ROLES_ASSIGNED');
    } catch (err) {
      this.saving.set(false);
      this.showError(err);
    }
  }

  onClose() {
    this.close.emit();
  }

  private loadMembers() {
    this.loadingUsers.set(true);
    this.organization.getMemberships().subscribe({
      next: (res) => {
        this.members.set(res.data.items);
        this.loadingUsers.set(false);
      },
      error: (err) => {
        this.loadingUsers.set(false);
        this.showError(err);
      }
    });
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
