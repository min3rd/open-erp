import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  Branch,
  DepartmentNode,
  FlatDepartmentNode,
  I18nService,
  Membership,
  RequirePermissionDirective,
  SharpButtonComponent,
  SkeletonTableComponent,
  TableColumn,
  TableComponent,
  TranslatePipe,
  flattenDepartments
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/services/auth.service';
import { PathListState, PathListStateService } from '../../../core/utils/path-list-state';
import { DepartmentFormDrawerComponent } from './department-form-drawer.component';
import { BranchFormDrawerComponent } from './branch-form-drawer.component';
import {
  CanvasGraphEdge,
  CanvasGraphNode,
  DepartmentGraphCanvasComponent
} from './department-graph-canvas.component';

type OrganizationView = 'list' | 'graph';

type OrgNodeKind = 'tenant' | 'branch' | 'department';

/** Composed organization chart node: workspace root → branches → departments. */
export interface OrgChartNode {
  id: string;
  kind: OrgNodeKind;
  code: string;
  name: string;
  depth: number;
  hasChildren: boolean;
  collapsed: boolean;
  memberCount: number;
  branchId: string | null;
  children: OrgChartNode[];
}

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
    SkeletonTableComponent,
    TranslatePipe,
    DepartmentFormDrawerComponent,
    BranchFormDrawerComponent,
    DepartmentGraphCanvasComponent,
    RequirePermissionDirective
  ],
  providers: [PathListStateService],
  templateUrl: './organization.component.html'
})
export class OrganizationComponent implements OnInit {
  private organization = inject(OrganizationService);
  private auth = inject(AuthService);
  private i18n = inject(I18nService);
  private listState = inject(PathListStateService);
  private pendingState: PathListState | null = null;

  readonly branches = signal<Branch[]>([]);
  readonly departmentTree = signal<DepartmentNode[]>([]);
  readonly memberships = signal<Membership[]>([]);
  readonly branchesLoading = signal<boolean>(false);
  readonly departmentsLoading = signal<boolean>(false);
  readonly membershipsLoading = signal<boolean>(false);
  readonly branchesError = signal<boolean>(false);
  readonly departmentsError = signal<boolean>(false);
  readonly membershipsError = signal<boolean>(false);
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

  readonly flatDepartments = computed<FlatDepartmentNode[]>(() => flattenDepartments(this.departmentTree()));

  /** Departments nested by parent, as roots of per-branch forests. */
  private readonly departmentForest = computed<OrgChartNode[]>(() => {
    const counts = this.memberCounts();
    const byId = new Map<string, OrgChartNode>();
    for (const item of this.flatDepartments()) {
      byId.set(item.id, {
        id: item.id,
        kind: 'department',
        code: item.code,
        name: item.name,
        depth: 0,
        hasChildren: false,
        collapsed: false,
        memberCount: counts.get(item.id) || 0,
        branchId: item.branch_id ?? null,
        children: []
      });
    }
    const roots: OrgChartNode[] = [];
    for (const item of this.flatDepartments()) {
      const node = byId.get(item.id)!;
      const parent = item.parent_id ? byId.get(item.parent_id) : undefined;
      if (parent) {
        parent.children.push(node);
        parent.hasChildren = true;
      } else {
        roots.push(node);
      }
    }
    return roots;
  });

  /**
   * Full organization chart: the workspace root, each branch, then the branch's
   * departments; departments without a branch hang directly under the root.
   */
  readonly orgChart = computed<OrgChartNode>(() => {
    const collapsed = this.collapsedIds();
    const branchMembers = new Map<string, number>();
    for (const membership of this.memberships()) {
      if (membership.branch_id) {
        branchMembers.set(membership.branch_id, (branchMembers.get(membership.branch_id) || 0) + 1);
      }
    }

    const root: OrgChartNode = {
      id: 'tenant',
      kind: 'tenant',
      code: '',
      name: this.auth.user()?.tenant_name || 'Open-ERP',
      depth: 0,
      hasChildren: false,
      collapsed: collapsed.has('tenant'),
      memberCount: this.memberships().length,
      branchId: null,
      children: []
    };

    const applyDepth = (node: OrgChartNode, depth: number): void => {
      node.depth = depth;
      node.collapsed = collapsed.has(node.id);
      for (const child of node.children) {
        applyDepth(child, depth + 1);
      }
    };

    const forest = this.departmentForest();
    for (const branch of [...this.branches()].sort((a, b) => a.code.localeCompare(b.code))) {
      const branchNode: OrgChartNode = {
        id: branch.id,
        kind: 'branch',
        code: branch.code,
        name: branch.name,
        depth: 1,
        hasChildren: false,
        collapsed: collapsed.has(branch.id),
        memberCount: branchMembers.get(branch.id) || 0,
        branchId: branch.id,
        children: forest.filter((node) => node.branchId === branch.id)
      };
      branchNode.hasChildren = branchNode.children.length > 0;
      branchNode.children.forEach((child) => applyDepth(child, 2));
      root.children.push(branchNode);
    }
    const unassigned = forest.filter((node) => !node.branchId);
    unassigned.forEach((child) => applyDepth(child, 1));
    root.children.push(...unassigned);
    root.hasChildren = root.children.length > 0;
    return root;
  });

  readonly visibleOrgNodes = computed<OrgChartNode[]>(() => {
    const out: OrgChartNode[] = [];
    const walk = (node: OrgChartNode): void => {
      out.push(node);
      if (node.hasChildren && !this.isCollapsed(node.id)) {
        node.children.forEach(walk);
      }
    };
    walk(this.orgChart());
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
    let cursor = 0;

    const walk = (node: OrgChartNode, depth: number, parentId: string | null): number => {
      const children = collapsed.has(node.id) ? [] : node.children;
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
        kind: node.kind,
        code: node.code,
        name: node.name,
        depth,
        x,
        y,
        hasChildren: node.children.length > 0,
        collapsed: collapsed.has(node.id),
        memberCount: node.memberCount
      });
      return x;
    };

    walk(this.orgChart(), 0, null);

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
    this.listState.bind('/settings/organization', (state) => this.applyRouteState(state));
    this.load();
  }

  /** Deep-link / F5: restore the view, selected department and any open drawer. */
  private applyRouteState(state: PathListState) {
    this.pendingState = state;
    this.viewMode.set(state.filter === 'graph' ? 'graph' : 'list');
    const mode = state.mode || 'list';
    if (!mode.startsWith('branch-')) {
      this.selectedId.set(state.id);
    }
    this.applyDrawerMode(mode, state.id);
  }

  /** view = `filter` (list|graph), drawer = `mode`. */
  private applyDrawerMode(mode: string, id: string | null) {
    // Create modes need no existing node, so they may open before data arrives;
    // edit/delete modes need the loaded tree, so they wait for the reload.
    const createMode = mode === 'dept-create' || mode === 'branch-create';
    if (!createMode && !this.branches().length && !this.departmentTree().length) {
      return;
    }
    this.departmentDrawerOpen.set(false);
    this.branchDrawerOpen.set(false);
    this.confirmDelete.set(null);
    switch (mode) {
      case 'dept-create':
        this.editingDepartment.set(null);
        this.presetParentId.set(id);
        this.departmentDrawerOpen.set(true);
        break;
      case 'dept-edit': {
        const department = this.findNode(this.departmentTree(), id);
        if (department) {
          this.editingDepartment.set(department);
          this.presetParentId.set(department.parent_id || null);
          this.departmentDrawerOpen.set(true);
        }
        break;
      }
      case 'branch-create':
        this.editingBranch.set(null);
        this.branchDrawerOpen.set(true);
        break;
      case 'branch-edit': {
        const branch = this.branches().find((item) => item.id === id) ?? null;
        if (branch) {
          this.editingBranch.set(branch);
          this.branchDrawerOpen.set(true);
        }
        break;
      }
      case 'dept-delete': {
        const department = this.findNode(this.departmentTree(), id);
        if (department) {
          this.confirmDelete.set({ type: 'DEPARTMENT', id: department.id, name: department.name });
        }
        break;
      }
      case 'branch-delete': {
        const branch = this.branches().find((item) => item.id === id) ?? null;
        if (branch) {
          this.confirmDelete.set({ type: 'BRANCH', id: branch.id, name: branch.name });
        }
        break;
      }
      default:
        break;
    }
  }

  /**
   * Each region loads on its own so a slow/failed region never blocks the
   * others (Sprint 04, TASK-367 / AC-12). Drawer state is applied when the
   * branch + department regions settle.
   */
  load() {
    this.loadBranches();
    this.loadDepartments();
    this.loadMemberships();
  }

  loadBranches() {
    this.branchesLoading.set(true);
    this.branchesError.set(false);
    this.organization.getBranches().subscribe({
      next: (res) => {
        // Deleting a branch is a soft delete (status INACTIVE); keep those rows
        // out of the list, otherwise the deleted row stays and looks like the
        // delete failed (BUG-121 follow-up).
        this.branches.set(res.data.items.filter((branch) => branch.status !== 'INACTIVE'));
        this.branchesLoading.set(false);
        this.applyPendingDrawer();
      },
      error: (err) => {
        this.branchesLoading.set(false);
        this.branchesError.set(true);
        this.showError(err);
      }
    });
  }

  /** Drops soft-deleted (INACTIVE) departments from the tree, recursively. */
  private withoutInactiveDepartments(nodes: DepartmentNode[]): DepartmentNode[] {
    return nodes
      .filter((node) => node.status !== 'INACTIVE')
      .map((node) => ({ ...node, children: this.withoutInactiveDepartments(node.children ?? []) }));
  }

  loadDepartments() {
    this.departmentsLoading.set(true);
    this.departmentsError.set(false);
    this.organization.getDepartmentTree().subscribe({
      next: (res) => {
        // Same soft-delete rule as branches: a deleted department is INACTIVE
        // and must disappear from the tree (BUG-121 follow-up).
        const tree = this.withoutInactiveDepartments(res.data.items);
        this.departmentTree.set(tree);
        if (this.selectedId() && !this.findNode(tree, this.selectedId())) {
          this.selectedId.set(null);
        }
        this.departmentsLoading.set(false);
        this.applyPendingDrawer();
      },
      error: (err) => {
        this.departmentsLoading.set(false);
        this.departmentsError.set(true);
        this.showError(err);
      }
    });
  }

  /** Member counts only decorate the chart; a failure must not block it. */
  loadMemberships() {
    this.membershipsLoading.set(true);
    this.membershipsError.set(false);
    this.organization.getMemberships().subscribe({
      next: (res) => {
        this.memberships.set(res.data.items);
        this.membershipsLoading.set(false);
      },
      error: () => {
        this.membershipsLoading.set(false);
        this.membershipsError.set(true);
      }
    });
  }

  private applyPendingDrawer() {
    const state = this.pendingState ?? this.listState.current();
    this.applyDrawerMode(state.mode ?? 'list', state.id ?? null);
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
    this.listState.set({ filter: mode });
  }

  selectDepartment(department: DepartmentNode) {
    this.selectedId.set(department.id);
    this.listState.set({ id: department.id, mode: 'list' });
  }

  /** Chart row click: only departments open the detail panel. */
  selectOrgNode(node: OrgChartNode) {
    if (node.kind !== 'department') {
      return;
    }
    const department = this.findNode(this.departmentTree(), node.id);
    if (department) {
      this.selectDepartment(department);
    }
  }

  branchById(id: string): Branch | undefined {
    return this.branches().find((branch) => branch.id === id);
  }

  departmentById(id: string): DepartmentNode | null {
    return this.findNode(this.departmentTree(), id);
  }

  selectDepartmentById(departmentId: string) {
    this.selectedId.set(departmentId);
    this.listState.set({ id: departmentId, mode: 'list' });
  }

  clearSelection() {
    this.selectedId.set(null);
    this.listState.set({ id: null, mode: 'list' });
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
    this.listState.set({ mode: 'dept-create', id: parentId });
  }

  openEditDepartment(department: DepartmentNode) {
    this.editingDepartment.set(department);
    this.presetParentId.set(department.parent_id || null);
    this.departmentDrawerOpen.set(true);
    this.listState.set({ mode: 'dept-edit', id: department.id });
  }

  closeDepartmentDrawer() {
    this.departmentDrawerOpen.set(false);
    this.listState.set({ mode: 'list' });
  }

  onDepartmentSaved(code: string) {
    this.departmentDrawerOpen.set(false);
    this.listState.set({ mode: 'list' });
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  openCreateBranch() {
    this.editingBranch.set(null);
    this.branchDrawerOpen.set(true);
    this.listState.set({ mode: 'branch-create', id: null });
  }

  openEditBranch(branch: Branch) {
    this.editingBranch.set(branch);
    this.branchDrawerOpen.set(true);
    this.listState.set({ mode: 'branch-edit', id: branch.id });
  }

  closeBranchDrawer() {
    this.branchDrawerOpen.set(false);
    this.listState.set({ mode: 'list' });
  }

  onBranchSaved(code: string) {
    this.branchDrawerOpen.set(false);
    this.listState.set({ mode: 'list' });
    this.successText.set(this.i18n.t(code));
    this.errorText.set('');
    this.load();
  }

  askDeleteBranch(branch: Branch) {
    this.confirmDelete.set({ type: 'BRANCH', id: branch.id, name: branch.name });
    this.listState.set({ mode: 'branch-delete', id: branch.id });
  }

  askDeleteDepartment(department: DepartmentNode) {
    this.confirmDelete.set({ type: 'DEPARTMENT', id: department.id, name: department.name });
    this.listState.set({ mode: 'dept-delete', id: department.id });
  }

  cancelDelete() {
    this.confirmDelete.set(null);
    this.listState.set({ mode: 'list' });
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
        this.listState.set({ mode: 'list' });
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
