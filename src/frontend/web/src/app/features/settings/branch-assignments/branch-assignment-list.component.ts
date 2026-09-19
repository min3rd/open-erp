import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApiErrorResponse,
  BadgeComponent,
  Branch,
  BranchAssignment,
  I18nService,
  Membership,
  SelectOption,
  SharpButtonComponent,
  SharpSelectComponent,
  TableColumn,
  TableComponent,
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
import { BranchAssignmentDrawerComponent } from './branch-assignment-drawer.component';

interface AssignmentUser {
  user_id: string;
  user_email: string;
}

@Component({
  selector: 'app-branch-assignment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    BadgeComponent,
    SharpButtonComponent,
    SharpSelectComponent,
    TranslatePipe,
    BranchAssignmentDrawerComponent
  ],
  templateUrl: './branch-assignment-list.component.html'
})
export class BranchAssignmentListComponent implements OnInit {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  readonly assignments = signal<BranchAssignment[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly members = signal<Membership[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  readonly selectedUserId = signal<string>('');
  readonly drawerOpen = signal<boolean>(false);
  readonly drawerUser = signal<AssignmentUser | null>(null);

  readonly confirmRemove = signal<BranchAssignment | null>(null);
  readonly removing = signal<boolean>(false);

  readonly columns: TableColumn[] = [
    { key: 'user', labelKey: 'ORGANIZATION_MEMBER_USER' },
    { key: 'branch', labelKey: 'ORGANIZATION_BRANCHES' },
    { key: 'primary', labelKey: 'ORGANIZATION_BRANCH_ASSIGNMENT_PRIMARY_BRANCH', align: 'center' },
    { key: 'manage', labelKey: 'ORGANIZATION_BRANCH_ASSIGNMENT_MANAGE_COL', align: 'center' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  readonly memberOptions = computed<SelectOption[]>(() =>
    this.members().map((member) => ({
      value: member.user_id,
      label: `${member.user_full_name || member.user_email} (${member.user_email})`
    }))
  );

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    forkJoin({
      assignments: this.organization.getBranchAssignments(),
      branches: this.organization.getBranches(),
      members: this.organization.getMemberships()
    }).subscribe({
      next: ({ assignments, branches, members }) => {
        this.assignments.set(assignments.data.items);
        this.branches.set(branches.data.items);
        this.members.set(members.data.items);
        if (!this.selectedUserId() && members.data.items.length) {
          this.selectedUserId.set(members.data.items[0].user_id);
        }
        this.loading.set(false);
        this.errorText.set('');
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  openDrawer(userId?: string) {
    const targetId = userId || this.selectedUserId();
    const member = this.members().find((item) => item.user_id === targetId);
    if (!targetId || !member) {
      this.errorText.set(this.i18n.t('ORGANIZATION_BRANCH_ASSIGNMENT_SELECT_USER'));
      return;
    }
    this.drawerUser.set({ user_id: member.user_id, user_email: member.user_email || '' });
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

  askRemove(assignment: BranchAssignment) {
    this.confirmRemove.set(assignment);
  }

  cancelRemove() {
    this.confirmRemove.set(null);
  }

  confirmRemoveAssignment() {
    const target = this.confirmRemove();
    if (!target) {
      return;
    }
    this.removing.set(true);
    this.organization.deleteBranchAssignment(target.id).subscribe({
      next: (res) => {
        this.removing.set(false);
        this.confirmRemove.set(null);
        this.successText.set(this.i18n.t(res.code, res.params));
        this.errorText.set('');
        this.load();
      },
      error: (err) => {
        this.removing.set(false);
        this.showError(err);
      }
    });
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
    this.successText.set('');
  }
}
