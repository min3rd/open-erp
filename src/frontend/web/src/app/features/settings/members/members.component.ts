import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApiErrorResponse,
  BadgeComponent,
  Branch,
  BranchAssignment,
  DepartmentNode,
  FlatDepartmentNode,
  I18nService,
  Membership,
  TableColumn,
  TableComponent,
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
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
    BranchAssignmentDrawerComponent
  ],
  templateUrl: './members.component.html'
})
export class MembersComponent implements OnInit {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

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
    this.load();
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
        this.departments.set(this.flatten(departments.data.items, 0, []));
        this.assignments.set(assignments.data.items);
        this.loading.set(false);
        this.errorText.set('');
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
    this.editingMembership.set(null);
    this.userDrawerOpen.set(true);
  }

  openEditMembership(membership: Membership) {
    this.editingMembership.set(membership);
    this.userDrawerOpen.set(true);
  }

  closeUserDrawer() {
    this.userDrawerOpen.set(false);
  }

  onMembershipSaved(code: string) {
    this.userDrawerOpen.set(false);
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  openAssignmentDrawer(membership: Membership) {
    this.assignmentUser.set(membership);
    this.assignmentDrawerOpen.set(true);
  }

  closeAssignmentDrawer() {
    this.assignmentDrawerOpen.set(false);
  }

  onAssignmentSaved(code: string) {
    this.assignmentDrawerOpen.set(false);
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  askRemove(membership: Membership) {
    this.confirmRemove.set(membership);
  }

  cancelRemove() {
    this.confirmRemove.set(null);
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
