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
import { ListRouteState, RouteListStateService } from '../../../core/utils/route-list-state.service';
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
  providers: [RouteListStateService],
  templateUrl: './branch-assignment-list.component.html'
})
export class BranchAssignmentListComponent implements OnInit {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);
  private routeState = inject(RouteListStateService);

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

  private loadedListKey = '';
  private currentState: ListRouteState | null = null;

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
    this.routeState.bind((state) => this.applyState(state));
  }

  private applyState(state: ListRouteState): void {
    this.currentState = state;
    const listKey = this.routeState.listKey(state);
    if (listKey !== this.loadedListKey) {
      this.loadedListKey = listKey;
      this.load();
    }
    this.applySelection(state);
  }

  private applySelection(state: ListRouteState): void {
    if (state.drawer === 'assign') {
      const member = state.id ? this.members().find((item) => item.user_id === state.id) ?? null : null;
      this.drawerUser.set(member ? { user_id: member.user_id, user_email: member.user_email || '' } : null);
      this.drawerOpen.set(!!member);
      this.confirmRemove.set(null);
      if (member) {
        this.selectedUserId.set(member.user_id);
      }
      return;
    }
    if (state.drawer === 'delete') {
      const assignment = state.id ? this.assignments().find((item) => item.id === state.id) ?? null : null;
      this.confirmRemove.set(assignment);
      this.drawerOpen.set(false);
      this.drawerUser.set(null);
      return;
    }
    this.drawerOpen.set(false);
    this.drawerUser.set(null);
    this.confirmRemove.set(null);
    if (state.id) {
      const member = this.members().find((item) => item.user_id === state.id) ?? null;
      if (member) {
        this.selectedUserId.set(member.user_id);
      }
    }
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

  onUserSelected(userId: string) {
    this.routeState.set({ id: userId || null, drawer: null });
  }

  openDrawer(userId?: string) {
    const targetId = userId || this.selectedUserId();
    const member = this.members().find((item) => item.user_id === targetId);
    if (!targetId || !member) {
      this.errorText.set(this.i18n.t('ORGANIZATION_BRANCH_ASSIGNMENT_SELECT_USER'));
      return;
    }
    this.routeState.set({ drawer: 'assign', id: targetId });
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

  askRemove(assignment: BranchAssignment) {
    this.routeState.set({ drawer: 'delete', id: assignment.id });
  }

  cancelRemove() {
    this.routeState.set({ drawer: null, id: null });
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
        this.routeState.set({ drawer: null, id: null });
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
