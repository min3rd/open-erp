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
  Membership,
  SharpButtonComponent,
  TableColumn,
  TableComponent,
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
import { DepartmentFormDrawerComponent } from './department-form-drawer.component';
import { BranchFormDrawerComponent } from './branch-form-drawer.component';
import {
  CanvasGraphEdge,
  CanvasGraphNode,
  DepartmentGraphCanvasComponent
} from './department-graph-canvas.component';

type OrganizationView = 'list' | 'graph';

const VIEW_STORAGE_KEY = 'openerp_org_view';
const GRAPH_NODE_WIDTH = 152;
const GRAPH_NODE_HEIGHT = 56;
const GRAPH_COLUMN_GAP = 28;
const GRAPH_ROW_GAP = 48;
const GRAPH_PADDING = 24;

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
    BranchFormDrawerComponent,
    DepartmentGraphCanvasComponent
  ],
  templateUrl: './organization.component.html'
})
export class OrganizationComponent implements OnInit {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  readonly branches = signal<Branch[]>([]);
  readonly departmentTree = signal<DepartmentNode[]>([]);
  readonly memberships = signal<Membership[]>([]);
  readonly loading = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly successText = signal<string>('');

  readonly viewMode = signal<OrganizationView>(this.readStoredView());
  readonly collapsedIds = signal<Set<string>>(new Set<string>());
  readonly selectedId = signal<string | null>(null);

  readonly departmentDrawerOpen = signal<boolean>(false);
  readonly editingDepartment = signal<DepartmentNode | null>(null);
  readonly presetParentId = signal<string | null>(null);
  readonly branchDrawerOpen = signal<boolean>(false);
  readonly editingBranch = signal<Branch | null>(null);

  readonly confirmDelete = signal<{ type: 'BRANCH' | 'DEPARTMENT'; id: string; name: string } | null>(null);
  readonly deleting = signal<boolean>(false);

  readonly graphNodeWidth = GRAPH_NODE_WIDTH;
  readonly graphNodeHeight = GRAPH_NODE_HEIGHT;

  readonly branchColumns: TableColumn[] = [
    { key: 'code', labelKey: 'ORGANIZATION_BRANCH_CODE', mono: true },
    { key: 'name', labelKey: 'ORGANIZATION_BRANCH_NAME' },
    { key: 'phone', labelKey: 'ORGANIZATION_BRANCH_PHONE' },
    { key: 'address', labelKey: 'ORGANIZATION_BRANCH_ADDRESS' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right' }
  ];

  readonly flatDepartments = computed<FlatDepartmentNode[]>(() => this.flatten(this.departmentTree(), 0, []));

  readonly visibleDepartments = computed<FlatDepartmentNode[]>(() => {
    const out: FlatDepartmentNode[] = [];
    this.walkVisible(this.departmentTree(), 0, out);
    return out;
  });

  readonly memberCounts = computed<Map<string, number>>(() => {
    const counts = new Map<string, number>();
    for (const membership of this.memberships()) {
      if (membership.department_id) {
        counts.set(membership.department_id, (counts.get(membership.department_id) || 0) + 1);
      }
    }
    return counts;
  });

  readonly selectedDepartment = computed<DepartmentNode | null>(() =>
    this.findNode(this.departmentTree(), this.selectedId())
  );

  readonly graphLayout = computed<{ nodes: CanvasGraphNode[]; edges: CanvasGraphEdge[] }>(() => {
    const nodes: CanvasGraphNode[] = [];
    const positions = new Map<string, { x: number; y: number }>();
    const collapsed = this.collapsedIds();
    const counts = this.memberCounts();
    let cursor = 0;

    const walk = (node: DepartmentNode, depth: number, parentId: string | null): number => {
      const children = collapsed.has(node.id) ? [] : (node.children || []);
      let x: number;
      if (!children.length) {
        x = GRAPH_PADDING + cursor;
        cursor += GRAPH_NODE_WIDTH + GRAPH_COLUMN_GAP;
      } else {
        const childXs = children.map((child) => walk(child, depth + 1, node.id));
        x = (childXs[0] + childXs[childXs.length - 1]) / 2;
      }
      const y = GRAPH_PADDING + depth * (GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP);
      positions.set(node.id, { x, y });
      nodes.push({
        id: node.id,
        parentId,
        code: node.code,
        name: node.name,
        depth,
        x,
        y,
        hasChildren: (node.children?.length || 0) > 0,
        collapsed: collapsed.has(node.id),
        memberCount: counts.get(node.id) || 0
      });
      return x;
    };

    for (const root of this.departmentTree()) {
      walk(root, 0, null);
    }

    const edges: CanvasGraphEdge[] = [];
    for (const node of nodes) {
      if (!node.parentId) {
        continue;
      }
      const parent = positions.get(node.parentId);
      if (!parent) {
        continue;
      }
      edges.push({
        id: `${node.parentId}-${node.id}`,
        parentId: node.parentId,
        childId: node.id,
        x1: parent.x + GRAPH_NODE_WIDTH / 2,
        y1: parent.y + GRAPH_NODE_HEIGHT,
        x2: node.x + GRAPH_NODE_WIDTH / 2,
        y2: node.y
      });
    }

    return { nodes, edges };
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    forkJoin({
      branches: this.organization.getBranches(),
      departments: this.organization.getDepartmentTree(),
      memberships: this.organization.getMemberships()
    }).subscribe({
      next: ({ branches, departments, memberships }) => {
        const tree = departments.data.items;
        this.branches.set(branches.data.items);
        this.departmentTree.set(tree);
        this.memberships.set(memberships.data.items);
        if (this.selectedId() && !this.findNode(tree, this.selectedId())) {
          this.selectedId.set(null);
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

  indentation(depth: number): string {
    return `${depth * 14}px`;
  }

  setViewMode(mode: OrganizationView) {
    this.viewMode.set(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable (private mode) — view state is not persisted.
    }
  }

  selectDepartment(department: DepartmentNode) {
    this.selectedId.set(department.id);
  }

  selectDepartmentById(departmentId: string) {
    this.selectedId.set(departmentId);
  }

  clearSelection() {
    this.selectedId.set(null);
  }

  toggleCollapse(departmentId: string) {
    const next = new Set(this.collapsedIds());
    if (next.has(departmentId)) {
      next.delete(departmentId);
    } else {
      next.add(departmentId);
    }
    this.collapsedIds.set(next);
  }

  isCollapsed(departmentId: string): boolean {
    return this.collapsedIds().has(departmentId);
  }

  expandAll() {
    this.collapsedIds.set(new Set<string>());
  }

  collapseAll() {
    const ids = new Set<string>();
    const visit = (nodes: DepartmentNode[]) => {
      for (const node of nodes) {
        if (node.children?.length) {
          ids.add(node.id);
          visit(node.children);
        }
      }
    };
    visit(this.departmentTree());
    this.collapsedIds.set(ids);
  }

  memberCount(departmentId: string): number {
    return this.memberCounts().get(departmentId) || 0;
  }

  depthOf(departmentId: string): number {
    const find = (nodes: DepartmentNode[], depth: number): number | null => {
      for (const node of nodes) {
        if (node.id === departmentId) {
          return depth;
        }
        const found = find(node.children || [], depth + 1);
        if (found !== null) {
          return found;
        }
      }
      return null;
    };
    return find(this.departmentTree(), 0) ?? 0;
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
        if (this.selectedId() === pending.id) {
          this.selectedId.set(null);
        }
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

  private readStoredView(): OrganizationView {
    try {
      return localStorage.getItem(VIEW_STORAGE_KEY) === 'graph' ? 'graph' : 'list';
    } catch {
      return 'list';
    }
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

  private walkVisible(nodes: DepartmentNode[], depth: number, acc: FlatDepartmentNode[]) {
    for (const node of nodes) {
      acc.push({ ...node, depth });
      if (node.children?.length && !this.collapsedIds().has(node.id)) {
        this.walkVisible(node.children, depth + 1, acc);
      }
    }
  }

  private findNode(nodes: DepartmentNode[], nodeId: string | null): DepartmentNode | null {
    if (!nodeId) {
      return null;
    }
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }
      const found = this.findNode(node.children || [], nodeId);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
    this.successText.set('');
  }
}
