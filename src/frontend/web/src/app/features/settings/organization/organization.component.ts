import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApiErrorResponse,
  Branch,
  DepartmentNode,
  FlatDepartmentNode,
  I18nService,
  SharpButtonComponent,
  TableColumn,
  TableComponent,
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
import { DepartmentFormDrawerComponent } from './department-form-drawer.component';
import { BranchFormDrawerComponent } from './branch-form-drawer.component';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableComponent,
    SharpButtonComponent,
    TranslatePipe,
    DepartmentFormDrawerComponent,
    BranchFormDrawerComponent
  ],
  templateUrl: './organization.component.html'
})
export class OrganizationComponent implements OnInit {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  readonly branches = signal<Branch[]>([]);
  readonly departmentTree = signal<DepartmentNode[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  readonly departmentDrawerOpen = signal<boolean>(false);
  readonly editingDepartment = signal<DepartmentNode | null>(null);
  readonly presetParentId = signal<string | null>(null);
  readonly branchDrawerOpen = signal<boolean>(false);
  readonly editingBranch = signal<Branch | null>(null);

  readonly confirmDelete = signal<{ type: 'BRANCH' | 'DEPARTMENT'; id: string; name: string } | null>(null);
  readonly deleting = signal<boolean>(false);

  readonly branchColumns: TableColumn[] = [
    { key: 'code', labelKey: 'ORGANIZATION_BRANCH_CODE', mono: true },
    { key: 'name', labelKey: 'ORGANIZATION_BRANCH_NAME' },
    { key: 'phone', labelKey: 'ORGANIZATION_BRANCH_PHONE' },
    { key: 'address', labelKey: 'ORGANIZATION_BRANCH_ADDRESS' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  readonly flatDepartments = computed<FlatDepartmentNode[]>(() => this.flatten(this.departmentTree(), 0, []));

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    forkJoin({
      branches: this.organization.getBranches(),
      departments: this.organization.getDepartmentTree()
    }).subscribe({
      next: ({ branches, departments }) => {
        this.branches.set(branches.data.items);
        this.departmentTree.set(departments.data.items);
        this.loading.set(false);
        this.errorText.set('');
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  indentation(depth: number): string {
    return `${depth * 14}px`;
  }

  openCreateDepartment(parentId: string | null) {
    this.editingDepartment.set(null);
    this.presetParentId.set(parentId);
    this.departmentDrawerOpen.set(true);
  }

  openEditDepartment(department: DepartmentNode) {
    this.editingDepartment.set(department);
    this.presetParentId.set(department.parent_id || null);
    this.departmentDrawerOpen.set(true);
  }

  closeDepartmentDrawer() {
    this.departmentDrawerOpen.set(false);
  }

  onDepartmentSaved(code: string) {
    this.departmentDrawerOpen.set(false);
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  openCreateBranch() {
    this.editingBranch.set(null);
    this.branchDrawerOpen.set(true);
  }

  openEditBranch(branch: Branch) {
    this.editingBranch.set(branch);
    this.branchDrawerOpen.set(true);
  }

  closeBranchDrawer() {
    this.branchDrawerOpen.set(false);
  }

  onBranchSaved(code: string) {
    this.branchDrawerOpen.set(false);
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  askDeleteBranch(branch: Branch) {
    this.confirmDelete.set({ type: 'BRANCH', id: branch.id, name: branch.name });
  }

  askDeleteDepartment(department: DepartmentNode) {
    this.confirmDelete.set({ type: 'DEPARTMENT', id: department.id, name: department.name });
  }

  cancelDelete() {
    this.confirmDelete.set(null);
  }

  confirmDeleteAction() {
    const pending = this.confirmDelete();
    if (!pending) {
      return;
    }
    this.deleting.set(true);
    const request =
      pending.type === 'BRANCH'
        ? this.organization.deleteBranch(pending.id)
        : this.organization.deleteDepartment(pending.id);
    request.subscribe({
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
