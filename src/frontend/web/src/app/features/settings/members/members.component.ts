import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApiErrorResponse,
  BadgeComponent,
  Branch,
  BranchAssignment,
  FlatDepartmentNode,
  I18nService,
  Membership,
  RequirePermissionDirective,
  TableColumn,
  TableComponent,
  TranslatePipe,
  flattenDepartments
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';
import { UserAssignmentDrawerComponent } from './user-assignment-drawer.component';
import { BranchAssignmentDrawerComponent } from '../branch-assignments/branch-assignment-drawer.component';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    BadgeComponent,
    TranslatePipe,
    UserAssignmentDrawerComponent,
    BranchAssignmentDrawerComponent,
    RequirePermissionDirective
  ],
  providers: [PathListStateService],
  templateUrl: './members.component.html'
})
export class MembersComponent implements OnInit {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);
  private listState = inject(PathListStateService);

  readonly memberships = signal<Membership[]>([]);
  readonly branches = signal<Branch[]>([]);
  readonly departments = signal<FlatDepartmentNode[]>([]);
  readonly assignments = signal<BranchAssignment[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  readonly assignmentDrawerOpen = signal<boolean>(false);
  readonly assignmentUser = signal<Membership | null>(null);

  readonly userDrawerOpen = signal<boolean>(false);
  readonly editingMembership = signal<Membership | null>(null);

  readonly confirmRemove = signal<Membership | null>(null);
  readonly removing = signal<boolean>(false);

  private loadedListKey = '';
  private currentState: PathListState | null = null;

  readonly columns: TableColumn[] = [
    { key: 'user', labelKey: 'ORGANIZATION_MEMBER_USER' },
    { key: 'branch', labelKey: 'ORGANIZATION_MEMBER_BRANCH' },
    { key: 'department', labelKey: 'ORGANIZATION_MEMBER_DEPARTMENT' },
    { key: 'manager', labelKey: 'ORGANIZATION_MEMBER_MANAGER' },
    { key: 'title', labelKey: 'ORGANIZATION_MEMBER_TITLE' },
    { key: 'primary', labelKey: 'ORGANIZATION_MEMBER_PRIMARY', align: 'center' },
    { key: 'assignments', labelKey: 'ORGANIZATION_BRANCH_ASSIGNMENT_TITLE' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  readonly assignmentCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const assignment of this.assignments()) {
      counts[assignment.user_id] = (counts[assignment.user_id] || 0) + 1;
    }
    return counts;
  });

  ngOnInit() {
    this.listState.bind('/settings/members', (state) => this.applyState(state));
  }

  private applyState(state: PathListState): void {
    this.currentState = state;
    const listKey = this.listState.listKey(state);
    if (listKey !== this.loadedListKey) {
      this.loadedListKey = listKey;
      this.load();
    }
    this.applySelection(state);
  }

  private applySelection(state: PathListState): void {
    const membership = state.id ? this.memberships().find((item) => item.user_id === state.id) ?? null : null;
    this.editingMembership.set(state.mode === 'edit' ? membership : null);
    this.userDrawerOpen.set(state.mode === 'create' || (state.mode === 'edit' && !!membership));
    this.assignmentUser.set(state.mode === 'assign' ? membership : null);
    this.assignmentDrawerOpen.set(state.mode === 'assign' && !!membership);
    this.confirmRemove.set(state.mode === 'delete' ? membership : null);
  }

  private updateState(patch: Partial<PathListState>): void {
    this.listState.set(patch);
  }

  load() {
    this.loading.set(true);
    forkJoin({
      memberships: this.organization.getMemberships(),
      branches: this.organization.getBranches(),
      departments: this.organization.getDepartmentTree(),
      assignments: this.organization.getBranchAssignments()
    }).subscribe({
      next: ({ memberships, branches, departments, assignments }) => {
        this.memberships.set(memberships.data.items);
        this.branches.set(branches.data.items);
        this.departments.set(flattenDepartments(departments.data.items));
        this.assignments.set(assignments.data.items);
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

  assignmentCount(userId: string): number {
    return this.assignmentCounts()[userId] || 0;
  }

  openCreateMembership() {
    this.updateState({ mode: 'create', id: null });
  }

  openEditMembership(membership: Membership) {
    this.updateState({ mode: 'edit', id: membership.user_id });
  }

  closeUserDrawer() {
    this.updateState({ mode: 'list', id: null });
  }

  onMembershipSaved(code: string) {
    this.updateState({ mode: 'list', id: null });
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  openAssignmentDrawer(membership: Membership) {
    this.updateState({ mode: 'assign', id: membership.user_id });
  }

  closeAssignmentDrawer() {
    this.updateState({ mode: 'list', id: null });
  }

  onAssignmentSaved(code: string) {
    this.updateState({ mode: 'list', id: null });
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  askRemove(membership: Membership) {
    this.updateState({ mode: 'delete', id: membership.user_id });
  }

  cancelRemove() {
    this.updateState({ mode: 'list', id: null });
  }

  confirmRemoveMembership() {
    const target = this.confirmRemove();
    if (!target) {
      return;
    }
    this.removing.set(true);
    this.organization.deleteMembership(target.id).subscribe({
      next: (res) => {
        this.removing.set(false);
        this.updateState({ mode: 'list', id: null });
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
