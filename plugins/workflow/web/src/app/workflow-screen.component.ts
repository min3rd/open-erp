import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  I18nService,
  IconComponent,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpTextareaComponent,
  TabItem,
  TableColumn,
  TableComponent,
  TranslatePipe,
} from '@shared';
import {
  FormLookupItem,
  InstanceProgress,
  TenantRoleOption,
  TenantUserOption,
  WorkflowDefinition,
  WorkflowEvent,
  WorkflowInstance,
  WorkflowService,
  WorkflowTask,
} from './workflow.service';

interface PluginContext {
  theme?: string;
  language?: string;
  permissions?: string[];
  user?: { id: string; name: string; email: string } | null;
  userId?: string;
  notify?: (message: string) => void;
}

type WorkflowTab = 'inbox' | 'flows' | 'builder' | 'runs' | 'reports';
export type NodeType =
  | 'START'
  | 'END'
  | 'APPROVAL'
  | 'TASK'
  | 'CONDITION'
  | 'PARALLEL'
  | 'AUTO_WEBHOOK'
  | 'AUTO_ENTITY_UPDATE'
  | 'CC';

export interface FlowNode {
  id: string;
  type: NodeType;
  name?: string;
  next?: string | string[];
  outcome?: string;
  approval_mode?: string;
  vote_ratio?: number;
  assignment?: { kind?: string; user_id?: string; role?: string; field_ref?: string };
  sla?: { due_hours?: number; remind_before_hours?: number };
  branches?: Array<{ condition?: string; next?: string; label?: string }>;
  ui_x?: number;
  ui_y?: number;
  [key: string]: unknown;
}

export interface GraphNodeView {
  index: number;
  node: FlowNode;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  assigneeSummary: string;
  slaSummary: string;
}

export interface GraphEdgeView {
  id: string;
  fromId: string;
  toId: string;
  path: string;
  midX: number;
  midY: number;
  label: string;
  active: boolean;
}

const NODE_TYPES: NodeType[] = [
  'START',
  'APPROVAL',
  'TASK',
  'CONDITION',
  'PARALLEL',
  'AUTO_WEBHOOK',
  'AUTO_ENTITY_UPDATE',
  'CC',
  'END',
];

const HUMAN_TYPES: NodeType[] = ['APPROVAL', 'TASK'];

const DEFAULT_SYSTEM_ROLES: TenantRoleOption[] = [
  { id: 'sys-owner', code: 'TENANT_OWNER', name: 'Chủ sở hữu (Tenant Owner)', is_system: true },
  { id: 'sys-admin', code: 'TENANT_ADMIN', name: 'Quản trị viên (Tenant Admin)', is_system: true },
  { id: 'sys-gm', code: 'GENERAL_MANAGER', name: 'Quản lý chung (General Manager)', is_system: true },
  { id: 'sys-staff', code: 'STAFF', name: 'Nhân viên (Staff)', is_system: true },
  { id: 'sys-viewer', code: 'VIEWER', name: 'Người xem (Viewer)', is_system: true },
];

@Component({
  selector: 'app-workflow-screen',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DrawerComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpTextareaComponent,
    BadgeComponent,
    IconComponent,
    TableComponent,
  ],
  templateUrl: './workflow-screen.component.html',
})
export class WorkflowScreenComponent implements OnInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private api = inject(WorkflowService);
  private i18n = inject(I18nService);

  private _context: PluginContext | null = null;

  @Input()
  get context(): PluginContext | null {
    return this._context;
  }
  set context(val: PluginContext | null) {
    this._context = val;
    if (val?.language) {
      this.i18n.setLanguage(val.language as never);
    }
  }

  @Input()
  set language(lang: string | undefined) {
    if (lang) {
      this.i18n.setLanguage(lang as never);
    }
  }

  @Input() route = '';

  readonly tab = signal<WorkflowTab>('inbox');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly taskSearch = signal('');
  readonly flowSearch = signal('');
  readonly runSearch = signal('');
  readonly statusFilter = signal('ALL');
  readonly addNodeType = signal<NodeType>('APPROVAL');

  // Directory & Cross-plugin Lookup State (Eliminates raw UUID inputs)
  readonly tenantUsers = signal<TenantUserOption[]>([]);
  readonly tenantRoles = signal<TenantRoleOption[]>(DEFAULT_SYSTEM_ROLES);
  readonly availableForms = signal<FormLookupItem[]>([]);
  readonly userPickerSearch = signal('');
  readonly userPickerOpen = signal(false);
  readonly reassignPickerSearch = signal('');
  readonly reassignPickerOpen = signal(false);
  readonly showAdvancedJson = signal(false);

  // Visual Node Graph Canvas State
  @ViewChild('graphCanvasContainer') graphCanvasContainer?: ElementRef<HTMLDivElement>;
  readonly graphDirection = signal<'LR' | 'TB'>('LR');
  readonly graphZoom = signal(100);
  readonly linkingFromIndex = signal<number | null>(null);
  readonly isPanning = signal(false);
  private panStartX = 0;
  private panStartY = 0;
  private panStartScrollLeft = 0;
  private panStartScrollTop = 0;
  private draggingNodeIndex: number | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Inbox
  readonly tasks = signal<WorkflowTask[]>([]);
  readonly inboxLoading = signal(false);
  readonly inboxScope = signal<'MINE' | 'ALL'>('MINE');
  readonly selectedTask = signal<WorkflowTask | null>(null);
  readonly taskDrawerOpen = signal(false);
  readonly taskRun = signal<InstanceProgress | null>(null);
  readonly taskDefinition = signal<WorkflowDefinition | null>(null);
  readonly comment = signal('');
  readonly returnTarget = signal('');
  readonly reassignUser = signal('');

  // Flows / builder
  readonly definitions = signal<WorkflowDefinition[]>([]);
  readonly flowsLoading = signal(false);
  readonly nodes = signal<FlowNode[]>([]);
  readonly selectedNodeIndex = signal<number | null>(null);
  readonly flowKey = signal('');
  readonly savedDefinitionId = signal('');
  readonly dirty = signal(false);
  readonly nodeJson = signal('');
  readonly pendingPublishId = signal('');

  // Runs
  readonly instances = signal<WorkflowInstance[]>([]);
  readonly runsLoading = signal(false);
  readonly selectedRun = signal<InstanceProgress | null>(null);
  readonly runLoading = signal(false);

  // Reports
  readonly tasksAll = signal<WorkflowTask[]>([]);
  readonly reportsLoading = signal(false);

  get permissions(): string[] {
    return this.context?.permissions ?? [];
  }

  can(permission: string): boolean {
    if (!this.permissions.length) {
      return true;
    }
    return (
      this.permissions.includes('*') ||
      this.permissions.includes('workflow:*') ||
      this.permissions.includes(permission)
    );
  }

  readonly pendingTaskCount = computed(
    () => this.tasks().filter((t) => t.status === 'PENDING').length,
  );

  readonly activeFlowCount = computed(
    () => this.definitions().filter((d) => d.status === 'PUBLISHED').length,
  );

  get screenTabs(): Array<{ key: WorkflowTab; labelKey: string; icon: string; count?: number }> {
    return [
      { key: 'inbox', labelKey: 'PLUGIN_WORKFLOW_TAB_INBOX', icon: 'bell', count: this.tasks().length },
      { key: 'flows', labelKey: 'PLUGIN_WORKFLOW_TAB_FLOWS', icon: 'grid', count: this.definitions().length },
      { key: 'builder', labelKey: 'PLUGIN_WORKFLOW_TAB_BUILDER', icon: 'edit-2', count: this.nodes().length },
      { key: 'runs', labelKey: 'PLUGIN_WORKFLOW_TAB_RUNS', icon: 'refresh-cw', count: this.instances().length },
      { key: 'reports', labelKey: 'PLUGIN_WORKFLOW_TAB_REPORTS', icon: 'file-text' },
    ];
  }

  selectTab(key: WorkflowTab): void {
    this.setTab(key);
  }

  readonly statusOptions: SelectOption[] = [
    { value: 'ALL', labelKey: 'COMMON_ALL' },
    { value: 'PENDING', labelKey: 'PLUGIN_WORKFLOW_STATUS_PENDING' },
    { value: 'COMPLETED', labelKey: 'PLUGIN_WORKFLOW_STATUS_COMPLETED' },
    { value: 'CANCELLED', labelKey: 'PLUGIN_WORKFLOW_STATUS_CANCELLED' },
  ];

  readonly flowStatusOptions: SelectOption[] = [
    { value: 'ALL', labelKey: 'COMMON_ALL' },
    { value: 'DRAFT', labelKey: 'PLUGIN_WORKFLOW_STATUS_DRAFT' },
    { value: 'PUBLISHED', labelKey: 'PLUGIN_WORKFLOW_STATUS_PUBLISHED' },
    { value: 'ARCHIVED', labelKey: 'PLUGIN_WORKFLOW_STATUS_ARCHIVED' },
  ];

  readonly filteredTasks = computed(() => {
    const term = this.taskSearch().trim().toLowerCase();
    const status = this.statusFilter();
    return this.tasks().filter((task) => {
      const matchesStatus = status === 'ALL' || task.status === status;
      const matchesTerm =
        !term ||
        (task.node_id ?? '').toLowerCase().includes(term) ||
        (task.instance_id ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  });

  readonly filteredDefinitions = computed(() => {
    const term = this.flowSearch().trim().toLowerCase();
    const status = this.statusFilter();
    return this.definitions().filter((def) => {
      const matchesStatus = status === 'ALL' || def.status === status;
      const matchesTerm =
        !term ||
        (def.key ?? '').toLowerCase().includes(term) ||
        (def.id ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  });

  readonly filteredRuns = computed(() => {
    const term = this.runSearch().trim().toLowerCase();
    return this.instances().filter((run) => {
      return (
        !term ||
        (run.id ?? '').toLowerCase().includes(term) ||
        (run.trigger_type ?? '').toLowerCase().includes(term) ||
        this.definitionLabel(run.definition_id).toLowerCase().includes(term)
      );
    });
  });

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'inbox', labelKey: 'PLUGIN_WORKFLOW_TAB_INBOX' },
    { id: 'flows', labelKey: 'PLUGIN_WORKFLOW_TAB_FLOWS' },
    { id: 'builder', labelKey: 'PLUGIN_WORKFLOW_TAB_BUILDER' },
    { id: 'runs', labelKey: 'PLUGIN_WORKFLOW_TAB_RUNS' },
    { id: 'reports', labelKey: 'PLUGIN_WORKFLOW_TAB_REPORTS' },
  ]);

  readonly typeOptions: SelectOption[] = NODE_TYPES.map((type) => ({
    value: type,
    labelKey: `PLUGIN_WORKFLOW_NODE_${type}`,
  }));

  readonly approvalModeOptions: SelectOption[] = [
    { value: 'ANY_ONE', labelKey: 'PLUGIN_WORKFLOW_MODE_ANY_ONE' },
    { value: 'ALL_APPROVE', labelKey: 'PLUGIN_WORKFLOW_MODE_ALL_APPROVE' },
    { value: 'VOTE_RATIO', labelKey: 'PLUGIN_WORKFLOW_MODE_VOTE_RATIO' },
  ];

  readonly assignmentKindOptions: SelectOption[] = [
    { value: 'USER', labelKey: 'PLUGIN_WORKFLOW_ASSIGN_USER' },
    { value: 'ROLE', labelKey: 'PLUGIN_WORKFLOW_ASSIGN_ROLE' },
    { value: 'MANAGER_OF', labelKey: 'PLUGIN_WORKFLOW_ASSIGN_MANAGER' },
    { value: 'FIELD_REF', labelKey: 'PLUGIN_WORKFLOW_ASSIGN_FIELD' },
  ];

  readonly outcomeOptions: SelectOption[] = [
    { value: 'APPROVED', labelKey: 'PLUGIN_WORKFLOW_OUTCOME_APPROVED' },
    { value: 'REJECTED', labelKey: 'PLUGIN_WORKFLOW_OUTCOME_REJECTED' },
    { value: 'CANCELLED', labelKey: 'PLUGIN_WORKFLOW_OUTCOME_CANCELLED' },
  ];

  readonly roleOptions = computed<SelectOption[]>(() => {
    const roles = this.tenantRoles();
    return roles.map((r) => ({
      value: r.code,
      label: r.name && r.name !== r.code ? `${r.name} (${r.code})` : r.code,
    }));
  });

  readonly fieldRefOptions = computed<SelectOption[]>(() => {
    const options: SelectOption[] = [
      { value: 'requester_id', label: 'Người gửi yêu cầu (requester_id)' },
      { value: 'manager_id', label: 'Quản lý trực tiếp (manager_id)' },
      { value: 'department_head_id', label: 'Trưởng bộ phận (department_head_id)' },
      { value: 'responder_email', label: 'Email người điền biểu mẫu (responder_email)' },
    ];
    for (const form of this.availableForms()) {
      for (const item of form.document?.items ?? []) {
        if (item.ref && item.type !== 'SECTION' && item.type !== 'PAGE' && item.type !== 'STEP') {
          options.push({
            value: `answers.${item.ref}`,
            label: `[${form.title_text || form.slug}] ${item.label || item.ref} (answers.${item.ref})`,
          });
        }
      }
    }
    return options;
  });

  readonly filteredAssigneeUsers = computed<TenantUserOption[]>(() => {
    const term = this.userPickerSearch().trim().toLowerCase();
    const list = this.allKnownUsers();
    if (!term) return list;
    return list.filter(
      (u) =>
        (u.full_name ?? u.name ?? '').toLowerCase().includes(term) ||
        (u.email ?? '').toLowerCase().includes(term) ||
        this.uidOf(u).toLowerCase().includes(term),
    );
  });

  readonly filteredReassignUsers = computed<TenantUserOption[]>(() => {
    const term = this.reassignPickerSearch().trim().toLowerCase();
    const list = this.allKnownUsers();
    if (!term) return list;
    return list.filter(
      (u) =>
        (u.full_name ?? u.name ?? '').toLowerCase().includes(term) ||
        (u.email ?? '').toLowerCase().includes(term) ||
        this.uidOf(u).toLowerCase().includes(term),
    );
  });

  readonly taskColumns: TableColumn[] = [
    { key: 'node', labelKey: 'PLUGIN_WORKFLOW_TASK_NODE', width: '28%' },
    { key: 'instance', labelKey: 'PLUGIN_WORKFLOW_TASK_INSTANCE', width: '22%' },
    { key: 'mode', labelKey: 'PLUGIN_WORKFLOW_TASK_MODE', width: '14%' },
    { key: 'due', labelKey: 'PLUGIN_WORKFLOW_TASK_DUE', width: '16%' },
    { key: 'status', labelKey: 'PLUGIN_WORKFLOW_TASK_STATUS', width: '10%' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right', width: '10%' },
  ];

  readonly flowColumns: TableColumn[] = [
    { key: 'key', labelKey: 'PLUGIN_WORKFLOW_KEY', width: '34%' },
    { key: 'version', labelKey: 'PLUGIN_WORKFLOW_VERSION', width: '10%' },
    { key: 'status', labelKey: 'PLUGIN_WORKFLOW_STATUS', width: '14%' },
    { key: 'nodes', labelKey: 'PLUGIN_WORKFLOW_NODES', width: '10%' },
    { key: 'updated', labelKey: 'PLUGIN_WORKFLOW_UPDATED_AT', width: '14%' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right', width: '18%' },
  ];

  readonly runColumns: TableColumn[] = [
    { key: 'id', labelKey: 'PLUGIN_WORKFLOW_RUN_ID', width: '26%' },
    { key: 'status', labelKey: 'PLUGIN_WORKFLOW_STATUS', width: '14%' },
    { key: 'outcome', labelKey: 'PLUGIN_WORKFLOW_OUTCOME', width: '14%' },
    { key: 'trigger', labelKey: 'PLUGIN_WORKFLOW_TRIGGER', width: '14%' },
    { key: 'created', labelKey: 'PLUGIN_WORKFLOW_CREATED_AT', width: '18%' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right', width: '14%' },
  ];

  readonly selectedNode = computed<FlowNode | null>(() => {
    const index = this.selectedNodeIndex();
    return index == null ? null : this.nodes()[index] ?? null;
  });

  // ------------------------------------------------------------------
  // VISUAL NODE GRAPH LAYOUT & SVG CONNECTOR ENGINE
  // ------------------------------------------------------------------

  readonly graphLayout = computed<{
    nodes: GraphNodeView[];
    edges: GraphEdgeView[];
    width: number;
    height: number;
  }>(() => {
    const list = this.nodes();
    const dir = this.graphDirection();
    const selectedIdx = this.selectedNodeIndex();
    const selectedId = selectedIdx != null ? list[selectedIdx]?.id : null;
    const nodeW = 224;
    const nodeH = 114;

    if (list.length === 0) {
      return { nodes: [], edges: [], width: 680, height: 340 };
    }

    // 1. Compute topological depth (level) from START / roots
    const indexById = new Map<string, number>();
    list.forEach((n, idx) => indexById.set(n.id, idx));

    const levels = new Array<number>(list.length).fill(0);
    // Relax edges up to N times (DAG)
    for (let pass = 0; pass < list.length; pass++) {
      for (let i = 0; i < list.length; i++) {
        for (const targetId of nextIdsOf(list[i])) {
          const targetIdx = indexById.get(targetId);
          if (targetIdx != null && targetIdx !== i) {
            if (levels[targetIdx] < levels[i] + 1) {
              levels[targetIdx] = Math.min(levels[i] + 1, list.length - 1);
            }
          }
        }
      }
    }

    // Group nodes by level
    const byLevel = new Map<number, number[]>();
    levels.forEach((lvl, idx) => {
      const bucket = byLevel.get(lvl) ?? [];
      bucket.push(idx);
      byLevel.set(lvl, bucket);
    });

    const maxBucketSize = Math.max(1, ...Array.from(byLevel.values()).map((b) => b.length));
    const colGap = dir === 'LR' ? 304 : 260;
    const rowGap = dir === 'LR' ? 152 : 164;
    const padX = 32;
    const padY = 32;

    const views: GraphNodeView[] = new Array(list.length);
    for (const [lvl, indices] of byLevel.entries()) {
      indices.forEach((idx, posInBucket) => {
        const node = list[idx];
        const offsetCenter = (maxBucketSize - indices.length) * 0.5;
        const autoX =
          dir === 'LR'
            ? padX + lvl * colGap
            : padX + (posInBucket + offsetCenter) * colGap;
        const autoY =
          dir === 'LR'
            ? padY + (posInBucket + offsetCenter) * rowGap
            : padY + lvl * rowGap;
        const x = typeof node.ui_x === 'number' ? node.ui_x : autoX;
        const y = typeof node.ui_y === 'number' ? node.ui_y : autoY;

        views[idx] = {
          index: idx,
          node,
          x,
          y,
          width: nodeW,
          height: nodeH,
          level: lvl,
          assigneeSummary: this.nodeAssigneeSummary(node),
          slaSummary: this.nodeSlaSummary(node),
        };
      });
    }

    // 2. Compute SVG Bezier connector edges
    const edges: GraphEdgeView[] = [];
    for (const fromView of views) {
      if (!fromView) continue;
      const targets = nextIdsOf(fromView.node);
      for (const targetId of targets) {
        const toIdx = indexById.get(targetId);
        if (toIdx == null || !views[toIdx]) continue;
        const toView = views[toIdx];

        let x1: number;
        let y1: number;
        let x2: number;
        let y2: number;
        let path: string;

        if (dir === 'LR') {
          x1 = fromView.x + fromView.width;
          y1 = fromView.y + fromView.height / 2;
          x2 = toView.x;
          y2 = toView.y + toView.height / 2;
          const dx = Math.max(Math.abs(x2 - x1) * 0.48, 48);
          path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        } else {
          x1 = fromView.x + fromView.width / 2;
          y1 = fromView.y + fromView.height;
          x2 = toView.x + toView.width / 2;
          y2 = toView.y;
          const dy = Math.max(Math.abs(y2 - y1) * 0.48, 44);
          path = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
        }

        const branchInfo = Array.isArray(fromView.node.branches)
          ? fromView.node.branches.find((b) => b?.next === targetId)
          : undefined;
        const edgeLabel = branchInfo?.label || branchInfo?.condition || '';

        edges.push({
          id: `${fromView.node.id}->${targetId}`,
          fromId: fromView.node.id,
          toId: targetId,
          path,
          midX: Math.round((x1 + x2) / 2),
          midY: Math.round((y1 + y2) / 2),
          label: edgeLabel,
          active: fromView.node.id === selectedId || targetId === selectedId,
        });
      }
    }

    const maxX = Math.max(680, ...views.map((v) => (v ? v.x + v.width + 60 : 0)));
    const maxY = Math.max(340, ...views.map((v) => (v ? v.y + v.height + 50 : 0)));
    return { nodes: views, edges, width: maxX, height: maxY };
  });

  readonly taskReturnTargets = computed<SelectOption[]>(() => {
    const current = this.selectedTask()?.node_id;
    const targets = new Map<string, string>();
    for (const node of this.taskDefinition()?.document?.nodes ?? []) {
      if (HUMAN_TYPES.includes(node['type'] as NodeType) && node['id'] !== current) {
        targets.set(String(node['id']), `${node['name'] ?? node['id']} (${node['id']})`);
      }
    }
    for (const task of this.taskRun()?.tasks ?? []) {
      if (task.node_id !== current && !targets.has(task.node_id)) {
        targets.set(task.node_id, task.node_id);
      }
    }
    return [
      { value: '', labelKey: 'COMMON_SELECT' },
      ...[...targets.entries()].map(([value, label]) => ({ value, label })),
    ];
  });

  readonly reportStats = computed(() => {
    const runs = this.instances();
    const tasks = this.tasksAll();
    const completed = runs.filter((run) => run.status === 'COMPLETED');
    const rejected = runs.filter((run) => run.outcome === 'REJECTED');
    const durations = completed
      .filter((run) => run.created_at && run.completed_at)
      .map(
        (run) =>
          (new Date(run.completed_at as string).getTime() -
            new Date(run.created_at as string).getTime()) /
          3_600_000,
      )
      .filter((hours) => Number.isFinite(hours) && hours >= 0);
    const now = Date.now();
    const overdue = tasks.filter(
      (task) =>
        !!task.overdue_at ||
        (!!task.due_at && new Date(task.due_at).getTime() < now),
    );
    return {
      total: runs.length,
      running: runs.filter((run) => run.status === 'RUNNING').length,
      completed: completed.length,
      cancelled: runs.filter((run) => run.status === 'CANCELLED').length,
      rejected: rejected.length,
      overdue: overdue.length,
      pending: tasks.length,
      avgHours:
        durations.length === 0
          ? 0
          : Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) /
            10,
      completionRate: runs.length === 0 ? 0 : Math.round((completed.length / runs.length) * 100),
      overdueRate: tasks.length === 0 ? 0 : Math.round((overdue.length / tasks.length) * 100),
    };
  });

  readonly taskStatusCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const task of this.tasksAll()) {
      counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
    }
    return [...counts.entries()].sort((left, right) => right[1] - left[1]);
  });

  ngOnInit(): void {
    if (this.context?.language) {
      this.i18n.setLanguage(this.context.language as never);
    }
    const origin = this.host.nativeElement.getAttribute('runtime-origin');
    if (origin) {
      this.api.setRuntimeOrigin(origin);
    }
    this.loadInbox();
    this.loadFlows();
    this.loadRuns();
    this.loadDirectoryLookups();
  }

  loadDirectoryLookups(): void {
    this.api.listTenantUsers().subscribe({
      next: (res) => {
        const items = res.data?.items ?? [];
        if (items.length > 0) {
          this.tenantUsers.set(items);
        }
      },
      error: () => {
        // Fallback to signed-in user via allKnownUsers()
      },
    });
    this.api.listTenantRoles().subscribe({
      next: (res) => {
        const items = res.data?.items ?? [];
        if (items.length > 0) {
          const merged = [...items];
          for (const sys of DEFAULT_SYSTEM_ROLES) {
            if (!merged.some((r) => r.code === sys.code)) {
              merged.push(sys);
            }
          }
          this.tenantRoles.set(merged);
        }
      },
      error: () => {
        // Keep DEFAULT_SYSTEM_ROLES
      },
    });
    this.api.listForms().subscribe({
      next: (res) => this.availableForms.set(res.data?.items ?? []),
      error: () => {},
    });
  }

  allKnownUsers(): TenantUserOption[] {
    const list = [...this.tenantUsers()];
    const currentId = this.actorId();
    if (currentId && !list.some((u) => this.uidOf(u) === currentId)) {
      list.unshift({
        user_id: currentId,
        email: this.context?.user?.email || 'current-user@tenant.local',
        full_name: this.context?.user?.name || 'Người dùng hiện tại',
        roles: ['TENANT_ADMIN'],
      });
    }
    return list;
  }

  uidOf(u: TenantUserOption): string {
    return u.user_id || u.id || '';
  }

  userLabel(userId: string | undefined | null): string {
    if (!userId) return '—';
    const found = this.allKnownUsers().find((u) => this.uidOf(u) === userId);
    if (found) {
      const name = found.full_name || found.name || found.email;
      return found.email && name !== found.email ? `${name} (${found.email})` : name;
    }
    if (userId === this.actorId() && this.context?.user) {
      return `${this.context.user.name || this.context.user.email} (${this.context.user.email})`;
    }
    return `Người dùng #${this.shortId(userId)}`;
  }

  roleLabel(roleCode: string | undefined | null): string {
    if (!roleCode) return '—';
    const found = this.tenantRoles().find((r) => r.code === roleCode);
    return found ? `${found.name} (${found.code})` : roleCode;
  }

  definitionLabel(definitionId: string | undefined | null): string {
    if (!definitionId) return '—';
    const found = this.definitions().find((d) => d.id === definitionId);
    return found ? `${found.key} (v${found.version})` : `#${this.shortId(definitionId)}`;
  }

  selectAssigneeUser(user: TenantUserOption): void {
    const uid = this.uidOf(user);
    this.updateAssignment({ user_id: uid });
    this.userPickerOpen.set(false);
    this.userPickerSearch.set('');
  }

  selectReassignUser(user: TenantUserOption): void {
    const uid = this.uidOf(user);
    this.reassignUser.set(uid);
    this.reassignPickerOpen.set(false);
    this.reassignPickerSearch.set('');
  }

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------

  setTab(id: string): void {
    const next = id as WorkflowTab;
    if (this.tab() === 'builder' && next !== 'builder' && this.dirty()) {
      const discard = window.confirm(this.i18n.t('PLUGIN_WORKFLOW_DISCARD_CONFIRM'));
      if (!discard) {
        return;
      }
      this.dirty.set(false);
    }
    if (next === 'builder' && this.nodes().length === 0) {
      const firstFlow = this.definitions()[0];
      if (firstFlow) {
        this.editFlow(firstFlow);
        return;
      }
      this.startCreateFlow();
      return;
    }
    this.tab.set(next);
    if (next === 'inbox') {
      this.loadInbox();
    } else if (next === 'flows') {
      this.loadFlows();
    } else if (next === 'runs') {
      this.loadRuns();
    } else if (next === 'reports') {
      this.loadReports();
    }
  }

  loadInbox(): void {
    this.inboxLoading.set(true);
    this.api.inbox(this.inboxScope()).subscribe({
      next: (result) => {
        this.inboxLoading.set(false);
        this.tasks.set(result.data?.items ?? []);
      },
      error: (err) => {
        this.inboxLoading.set(false);
        this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_INBOX');
      },
    });
  }

  setScope(scope: 'MINE' | 'ALL'): void {
    if (this.inboxScope() === scope) {
      return;
    }
    this.inboxScope.set(scope);
    this.loadInbox();
  }

  loadFlows(): void {
    this.flowsLoading.set(true);
    this.api.definitions().subscribe({
      next: (result) => {
        this.flowsLoading.set(false);
        this.definitions.set(result.data?.items ?? []);
      },
      error: (err) => {
        this.flowsLoading.set(false);
        this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_FLOWS');
      },
    });
  }

  loadRuns(): void {
    this.runsLoading.set(true);
    this.api.instances().subscribe({
      next: (result) => {
        this.runsLoading.set(false);
        this.instances.set(result.data?.items ?? []);
      },
      error: (err) => {
        this.runsLoading.set(false);
        this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_RUNS');
      },
    });
  }

  loadReports(): void {
    this.reportsLoading.set(true);
    this.api.instances().subscribe({
      next: (result) => {
        this.reportsLoading.set(false);
        this.instances.set(result.data?.items ?? []);
      },
      error: (err) => {
        this.reportsLoading.set(false);
        this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_REPORTS');
      },
    });
    this.api.inbox('ALL').subscribe({
      next: (result) => this.tasksAll.set(result.data?.items ?? []),
      error: (err) => this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_REPORTS'),
    });
  }

  // ------------------------------------------------------------------
  // Task drawer / actions
  // ------------------------------------------------------------------

  openTask(task: WorkflowTask): void {
    this.selectedTask.set(task);
    this.taskDefinition.set(null);
    this.taskRun.set(null);
    this.comment.set('');
    this.returnTarget.set('');
    this.reassignUser.set('');
    this.reassignPickerOpen.set(false);
    this.error.set('');
    this.taskDrawerOpen.set(true);
    this.api.progress(task.instance_id).subscribe({
      next: (result) => {
        const run = result.data ?? null;
        this.taskRun.set(run);
        if (run?.instance?.definition_id) {
          this.api.getDefinition(run.instance.definition_id).subscribe({
            next: (definition) => this.taskDefinition.set(definition.data ?? null),
          });
        }
      },
    });
  }

  closeTask(): void {
    this.taskDrawerOpen.set(false);
    this.selectedTask.set(null);
  }

  taskNodeLabel(task: WorkflowTask | null): string {
    if (!task) {
      return '';
    }
    const node = (this.taskDefinition()?.document?.nodes ?? []).find(
      (entry) => entry['id'] === task.node_id,
    );
    return String(node?.['name'] ?? task.node_id);
  }

  act(action: 'APPROVE' | 'REJECT' | 'RETURN' | 'REASSIGN' | 'CLAIM'): void {
    const task = this.selectedTask();
    const userId = this.actorId();
    if (!task || !userId) {
      this.error.set('PLUGIN_WORKFLOW_ERROR_NO_USER');
      return;
    }
    if (action === 'REJECT' && !this.comment().trim()) {
      this.error.set('PLUGIN_WORKFLOW_REASON_REQUIRED');
      return;
    }
    if (action === 'RETURN' && !this.returnTarget()) {
      this.error.set('PLUGIN_WORKFLOW_RETURN_TARGET_REQUIRED');
      return;
    }
    if (action === 'REASSIGN' && !this.reassignUser().trim()) {
      this.error.set('PLUGIN_WORKFLOW_REASSIGN_REQUIRED');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api
      .act(
        task.id,
        userId,
        action,
        this.comment().trim(),
        action === 'RETURN' ? this.returnTarget() : undefined,
        action === 'REASSIGN' ? this.reassignUser().trim() : undefined,
      )
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.success.set('PLUGIN_WORKFLOW_ACTION_DONE');
          this.closeTask();
          this.loadInbox();
          if (this.selectedRun()?.instance.id === task.instance_id) {
            this.openRun(this.selectedRun()!.instance);
          }
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.error?.code ?? err?.code ?? 'PLUGIN_WORKFLOW_ERROR_ACTION');
        },
      });
  }

  actorId(): string {
    return this.context?.user?.id ?? this.context?.userId ?? '';
  }

  // ------------------------------------------------------------------
  // Flow builder & Visual Graph Operations
  // ------------------------------------------------------------------

  startCreateFlow(): void {
    const defaultUser = this.actorId() || this.uidOf(this.allKnownUsers()[0] ?? { email: '' });
    const nodes: FlowNode[] = [
      { id: 'start', type: 'START', name: this.i18n.t('PLUGIN_WORKFLOW_NODE_START'), next: 'approve' },
      {
        id: 'approve',
        type: 'APPROVAL',
        name: this.i18n.t('PLUGIN_WORKFLOW_DEFAULT_APPROVAL'),
        approval_mode: 'ANY_ONE',
        assignment: { kind: 'USER', user_id: defaultUser },
        sla: { due_hours: 24, remind_before_hours: 4 },
        next: 'end',
      },
      { id: 'end', type: 'END', name: this.i18n.t('PLUGIN_WORKFLOW_NODE_END'), outcome: 'APPROVED' },
    ];
    this.flowKey.set('');
    this.nodes.set(nodes);
    this.selectedNodeIndex.set(1);
    this.savedDefinitionId.set('');
    this.dirty.set(false);
    this.syncNodeJson();
    this.tab.set('builder');
  }

  editFlow(definition: WorkflowDefinition): void {
    this.flowKey.set(definition.key);
    this.savedDefinitionId.set(definition.id);
    this.dirty.set(false);
    this.linkingFromIndex.set(null);
    this.tab.set('builder');
    const applyLoaded = (doc?: { nodes?: Record<string, unknown>[] }): void => {
      const loadedNodes = (doc?.nodes ?? []).map((node) => ({ ...node })) as unknown as FlowNode[];
      this.nodes.set(loadedNodes);
      const firstHumanIdx = loadedNodes.findIndex((n) => HUMAN_TYPES.includes(n.type));
      this.selectedNodeIndex.set(
        firstHumanIdx >= 0 ? firstHumanIdx : loadedNodes.length > 0 ? 0 : null,
      );
      this.syncNodeJson();
    };
    if (definition.document?.nodes?.length) {
      applyLoaded(definition.document);
    } else {
      this.nodes.set([]);
      this.selectedNodeIndex.set(null);
      this.api.getDefinition(definition.id).subscribe({
        next: (res) => applyLoaded(res.data?.document),
      });
    }
  }

  autoAlignGraph(): void {
    const next = this.nodes().map((node) => {
      const copy = { ...node };
      delete copy.ui_x;
      delete copy.ui_y;
      return copy;
    });
    this.nodes.set(next);
  }

  onCanvasMouseDown(event: MouseEvent): void {
    // Middle click (button 1) anywhere OR left click (button 0) on empty canvas background
    const isMiddleClick = event.button === 1;
    const target = event.target as HTMLElement | null;
    const isLeftClickOnBackground = event.button === 0 && (
      target === this.graphCanvasContainer?.nativeElement ||
      target?.tagName?.toLowerCase() === 'svg' ||
      target?.classList?.contains('canvas-background')
    );

    if (isMiddleClick || isLeftClickOnBackground) {
      event.preventDefault();
      const container = this.graphCanvasContainer?.nativeElement;
      if (!container) return;
      this.isPanning.set(true);
      this.panStartX = event.clientX;
      this.panStartY = event.clientY;
      this.panStartScrollLeft = container.scrollLeft;
      this.panStartScrollTop = container.scrollTop;
    }
  }

  onGraphNodeMouseDown(event: MouseEvent, index: number): void {
    // If middle click on a node, delegate to canvas pan instead of dragging the node
    if (event.button === 1) {
      event.preventDefault();
      this.onCanvasMouseDown(event);
      return;
    }
    if ((event.target as HTMLElement)?.closest('button')) {
      return;
    }
    this.draggingNodeIndex = index;
    const view = this.graphLayout().nodes[index];
    if (view) {
      this.dragOffsetX = event.clientX - view.x;
      this.dragOffsetY = event.clientY - view.y;
    }
  }

  onGraphMouseMove(event: MouseEvent): void {
    if (this.isPanning()) {
      event.preventDefault();
      const container = this.graphCanvasContainer?.nativeElement;
      if (container) {
        const dx = event.clientX - this.panStartX;
        const dy = event.clientY - this.panStartY;
        container.scrollLeft = this.panStartScrollLeft - dx;
        container.scrollTop = this.panStartScrollTop - dy;
      }
      return;
    }
    if (this.draggingNodeIndex == null) return;
    const idx = this.draggingNodeIndex;
    const next = [...this.nodes()];
    if (!next[idx]) return;
    const x = Math.max(16, Math.round(event.clientX - this.dragOffsetX));
    const y = Math.max(16, Math.round(event.clientY - this.dragOffsetY));
    next[idx] = { ...next[idx], ui_x: x, ui_y: y };
    this.nodes.set(next);
  }

  onGraphMouseUp(event?: MouseEvent): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
    }
    this.draggingNodeIndex = null;
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent): void {
    if (this.isPanning()) {
      event.preventDefault();
      const container = this.graphCanvasContainer?.nativeElement;
      if (container) {
        const dx = event.clientX - this.panStartX;
        const dy = event.clientY - this.panStartY;
        container.scrollLeft = this.panStartScrollLeft - dx;
        container.scrollTop = this.panStartScrollTop - dy;
      }
    }
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
    }
    this.draggingNodeIndex = null;
  }

  onNodeCardClick(index: number): void {
    const fromIdx = this.linkingFromIndex();
    if (fromIdx != null && fromIdx !== index) {
      this.toggleEdgeBetween(fromIdx, index);
      this.linkingFromIndex.set(null);
      return;
    }
    this.selectNode(index);
  }

  startLinkingFrom(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.linkingFromIndex() === index) {
      this.linkingFromIndex.set(null);
    } else {
      this.linkingFromIndex.set(index);
    }
  }

  toggleEdgeBetween(fromIndex: number, toIndex: number): void {
    const list = [...this.nodes()];
    const from = list[fromIndex];
    const to = list[toIndex];
    if (!from || !to || from.id === to.id) return;

    const currentIds = nextIdsOf(from);
    const nextIds = currentIds.includes(to.id)
      ? currentIds.filter((id) => id !== to.id)
      : [...currentIds, to.id];

    list[fromIndex] = {
      ...from,
      next: nextIds.length === 0 ? undefined : nextIds.length === 1 ? nextIds[0] : nextIds,
    };
    this.nodes.set(list);
    this.selectedNodeIndex.set(fromIndex);
    this.dirty.set(true);
    this.syncNodeJson();
  }

  removeEdge(fromId: string, toId: string): void {
    const list = [...this.nodes()];
    const fromIdx = list.findIndex((n) => n.id === fromId);
    if (fromIdx < 0) return;
    const from = list[fromIdx];
    const nextIds = nextIdsOf(from).filter((id) => id !== toId);
    list[fromIdx] = {
      ...from,
      next: nextIds.length === 0 ? undefined : nextIds.length === 1 ? nextIds[0] : nextIds,
    };
    this.nodes.set(list);
    this.dirty.set(true);
    this.syncNodeJson();
  }

  addNextTargetToSelected(targetId: string): void {
    if (!targetId) return;
    const idx = this.selectedNodeIndex();
    if (idx == null) return;
    const node = this.nodes()[idx];
    if (!node) return;
    const current = nextIdsOf(node);
    if (!current.includes(targetId)) {
      const updated = [...current, targetId];
      this.updateNode({ next: updated.length === 1 ? updated[0] : updated });
    }
  }

  removeNextTargetFromSelected(targetId: string): void {
    const idx = this.selectedNodeIndex();
    if (idx == null) return;
    const node = this.nodes()[idx];
    if (!node) return;
    const updated = nextIdsOf(node).filter((id) => id !== targetId);
    this.updateNode({
      next: updated.length === 0 ? undefined : updated.length === 1 ? updated[0] : updated,
    });
  }

  appendConnectedStep(fromIndex: number, type: NodeType = 'APPROVAL'): void {
    const list = [...this.nodes()];
    const source = list[fromIndex];
    if (!source) return;
    const id = this.nextNodeId(type);
    const existingTargets = nextIdsOf(source);
    const defaultUser = this.actorId() || this.uidOf(this.allKnownUsers()[0] ?? { email: '' });

    const newNode: FlowNode = {
      id,
      type,
      name: `${this.i18n.t(`PLUGIN_WORKFLOW_NODE_${type}`)} (${id})`,
      next: existingTargets.length === 1 ? existingTargets[0] : existingTargets.length > 1 ? existingTargets : undefined,
    };
    if (type === 'APPROVAL') {
      newNode.approval_mode = 'ANY_ONE';
      newNode.assignment = { kind: 'USER', user_id: defaultUser };
      newNode.sla = { due_hours: 24, remind_before_hours: 4 };
    } else if (type === 'TASK') {
      newNode.assignment = { kind: 'ROLE', role: 'STAFF' };
      newNode.sla = { due_hours: 24, remind_before_hours: 4 };
    }

    list[fromIndex] = { ...source, next: id };
    list.splice(fromIndex + 1, 0, newNode);
    this.nodes.set(list);
    this.selectedNodeIndex.set(fromIndex + 1);
    this.dirty.set(true);
    this.syncNodeJson();
  }

  addNode(type: NodeType = 'APPROVAL'): void {
    const next = [...this.nodes()];
    const id = this.nextNodeId(type);
    const defaultUser = this.actorId() || this.uidOf(this.allKnownUsers()[0] ?? { email: '' });
    const node: FlowNode = { id, type, name: this.i18n.t(`PLUGIN_WORKFLOW_NODE_${type}`) };
    if (type === 'APPROVAL') {
      node.approval_mode = 'ANY_ONE';
      node.assignment = { kind: 'USER', user_id: defaultUser };
      node.sla = { due_hours: 24, remind_before_hours: 4 };
    } else if (type === 'TASK') {
      node.assignment = { kind: 'ROLE', role: 'STAFF' };
      node.sla = { due_hours: 24, remind_before_hours: 4 };
    } else if (type === 'END') {
      node.outcome = 'APPROVED';
    } else if (type === 'CONDITION' || type === 'PARALLEL') {
      node.branches = [];
    }
    // Automatically wire before END if an END node exists
    const endIdx = next.findIndex((n) => n.type === 'END');
    if (endIdx > 0 && type !== 'END') {
      const prev = next[endIdx - 1];
      const endId = next[endIdx].id;
      node.next = endId;
      next[endIdx - 1] = { ...prev, next: id };
      next.splice(endIdx, 0, node);
      this.nodes.set(next);
      this.selectedNodeIndex.set(endIdx);
    } else {
      next.push(node);
      this.nodes.set(next);
      this.selectedNodeIndex.set(next.length - 1);
    }
    this.dirty.set(true);
    this.syncNodeJson();
  }

  selectNode(index: number): void {
    this.selectedNodeIndex.set(index);
    this.userPickerOpen.set(false);
    this.syncNodeJson();
  }

  deleteNode(index: number): void {
    const removed = this.nodes()[index];
    const next = this.nodes().filter((_, position) => position !== index);
    if (removed) {
      const removedTargets = nextIdsOf(removed);
      for (const node of next) {
        const ids = nextIdsOf(node);
        if (ids.includes(removed.id)) {
          const merged = [...ids.filter((id) => id !== removed.id), ...removedTargets];
          const unique = [...new Set(merged)];
          node.next = unique.length === 0 ? undefined : unique.length === 1 ? unique[0] : unique;
        }
      }
    }
    this.nodes.set(next);
    this.selectedNodeIndex.set(next.length === 0 ? null : Math.min(index, next.length - 1));
    this.dirty.set(true);
    this.syncNodeJson();
  }

  moveNode(index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= this.nodes().length) {
      return;
    }
    const next = [...this.nodes()];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    this.nodes.set(next);
    this.selectedNodeIndex.set(target);
    this.dirty.set(true);
  }

  updateNode(patch: Record<string, unknown>): void {
    const index = this.selectedNodeIndex();
    if (index == null) {
      return;
    }
    const next = [...this.nodes()];
    next[index] = { ...next[index], ...patch };
    this.nodes.set(next);
    this.dirty.set(true);
    this.syncNodeJson();
  }

  autoGenerateNodeIdFromName(): void {
    const node = this.selectedNode();
    if (!node || !node.name) return;
    const slug = node.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
    if (slug) {
      this.renameNodeId(node.id, slug);
    }
  }

  renameNodeId(oldId: string, newId: string): void {
    const clean = newId.trim();
    if (!clean || clean === oldId) return;
    const index = this.selectedNodeIndex();
    if (index == null) return;
    const next = this.nodes().map((n, idx) => {
      if (idx === index) {
        return { ...n, id: clean };
      }
      const ids = nextIdsOf(n);
      if (ids.includes(oldId)) {
        const replaced = ids.map((id) => (id === oldId ? clean : id));
        return { ...n, next: replaced.length === 1 ? replaced[0] : replaced };
      }
      return n;
    });
    this.nodes.set(next);
    this.dirty.set(true);
    this.syncNodeJson();
  }

  updateAssignment(patch: Record<string, unknown>): void {
    const node = this.selectedNode();
    const assignment = { ...((node?.['assignment'] as Record<string, unknown>) ?? {}), ...patch };
    this.updateNode({ assignment });
  }

  updateSla(field: 'due_hours' | 'remind_before_hours', value: string): void {
    const node = this.selectedNode();
    const sla = { ...((node?.['sla'] as Record<string, unknown>) ?? {}) };
    const parsed = Number(value);
    sla[field] = Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
    this.updateNode({ sla });
  }

  applyNodeJson(): void {
    if (this.applySelectedJson()) {
      this.error.set('');
      this.success.set('PLUGIN_WORKFLOW_NODE_APPLIED');
      this.syncNodeJson();
    }
  }

  private applySelectedJson(): boolean {
    const index = this.selectedNodeIndex();
    if (index == null || !this.nodeJson().trim()) {
      return true;
    }
    let parsed: FlowNode;
    try {
      parsed = JSON.parse(this.nodeJson()) as FlowNode;
    } catch {
      this.error.set('PLUGIN_WORKFLOW_ERROR_JSON');
      return false;
    }
    if (!parsed?.id || !parsed?.type || !NODE_TYPES.includes(parsed.type)) {
      this.error.set('PLUGIN_WORKFLOW_ERROR_NODE');
      return false;
    }
    const next = [...this.nodes()];
    next[index] = parsed;
    this.nodes.set(next);
    this.dirty.set(true);
    return true;
  }

  nodeAssignment(node: FlowNode): { kind: string; user_id: string; role: string; field_ref: string } {
    const assignment = (node['assignment'] as Record<string, unknown> | undefined) ?? {};
    return {
      kind: String(assignment['kind'] ?? 'USER'),
      user_id: String(assignment['user_id'] ?? ''),
      role: String(assignment['role'] ?? 'TENANT_ADMIN'),
      field_ref: String(assignment['field_ref'] ?? 'requester_id'),
    };
  }

  nodeAssigneeSummary(node: FlowNode): string {
    if (!this.isHuman(node)) {
      if (node.type === 'START') return 'Khởi tạo luồng';
      if (node.type === 'END') return `Kết quả: ${node.outcome || 'APPROVED'}`;
      return node.type;
    }
    const a = this.nodeAssignment(node);
    switch (a.kind) {
      case 'USER':
        return a.user_id ? this.userLabel(a.user_id) : 'Chưa chọn người xử lý';
      case 'ROLE':
        return this.roleLabel(a.role);
      case 'MANAGER_OF':
        return 'Quản lý trực tiếp';
      case 'FIELD_REF':
        return `Trường: ${a.field_ref}`;
      default:
        return a.kind;
    }
  }

  nodeSlaSummary(node: FlowNode): string {
    if (!this.isHuman(node)) return '';
    const due = this.nodeDueHours(node);
    const mode = this.modeLabel(String(node.approval_mode ?? 'ANY_ONE'));
    return due ? `${mode} · SLA ${due}h` : mode;
  }

  nodeDueHours(node: FlowNode): string {
    const sla = (node['sla'] as Record<string, unknown> | undefined) ?? {};
    return sla['due_hours'] == null ? '' : String(sla['due_hours']);
  }

  nodeRemindHours(node: FlowNode): string {
    const sla = (node['sla'] as Record<string, unknown> | undefined) ?? {};
    return sla['remind_before_hours'] == null ? '' : String(sla['remind_before_hours']);
  }

  nextIds(node: FlowNode): string[] {
    return nextIdsOf(node);
  }

  nextDisplay(node: FlowNode): string {
    return nextIdsOf(node).join(', ');
  }

  nodeLabelById(id: string): string {
    const found = this.nodes().find((n) => n.id === id);
    return found ? `${found.name || found.id} (${found.id})` : id;
  }

  setNext(value: string): void {
    const ids = value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => !!entry);
    if (ids.length === 0) {
      this.updateNode({ next: undefined });
    } else if (ids.length === 1) {
      this.updateNode({ next: ids[0] });
    } else {
      this.updateNode({ next: ids });
    }
  }

  nextOptions(): SelectOption[] {
    const selected = this.selectedNode();
    const currentNext = selected ? nextIdsOf(selected) : [];
    return [
      { value: '', labelKey: 'PLUGIN_WORKFLOW_SELECT_NEXT_STEP' },
      ...this.nodes()
        .filter((node) => node.id !== selected?.id && !currentNext.includes(node.id))
        .map((node) => ({ value: node.id, label: `${node.name || node.id} (${node.id})` })),
    ];
  }

  isHuman(node: FlowNode): boolean {
    return HUMAN_TYPES.includes(node.type);
  }

  nodeHeaderClass(type: NodeType): string {
    switch (type) {
      case 'START':
        return 'bg-emerald-600 text-white';
      case 'APPROVAL':
        return 'bg-blue-600 text-white';
      case 'TASK':
        return 'bg-indigo-600 text-white';
      case 'CONDITION':
        return 'bg-amber-600 text-white';
      case 'PARALLEL':
        return 'bg-purple-600 text-white';
      case 'END':
        return 'bg-slate-800 text-white dark:bg-slate-700';
      default:
        return 'bg-teal-600 text-white';
    }
  }

  saveFlow(): void {
    const key = this.flowKey().trim().toLowerCase();
    if (!key) {
      this.error.set('PLUGIN_WORKFLOW_ERROR_KEY_REQUIRED');
      return;
    }
    if (this.nodes().length === 0) {
      this.error.set('PLUGIN_WORKFLOW_ERROR_NODES_REQUIRED');
      return;
    }
    if (this.showAdvancedJson() && !this.applySelectedJson()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api.createDefinition(key, { nodes: this.nodes() }).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.savedDefinitionId.set(result.data?.id ?? '');
        this.dirty.set(false);
        this.success.set('PLUGIN_WORKFLOW_FLOW_SAVED');
        this.loadFlows();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.code ?? err?.error?.message ?? 'PLUGIN_WORKFLOW_ERROR_SAVE');
      },
    });
  }

  requestPublish(definition: WorkflowDefinition): void {
    this.pendingPublishId.set(definition.id);
  }

  cancelPublish(): void {
    this.pendingPublishId.set('');
  }

  confirmPublish(definition: WorkflowDefinition): void {
    this.busy.set(true);
    this.pendingPublishId.set('');
    this.api.publishDefinition(definition.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.success.set('PLUGIN_WORKFLOW_FLOW_PUBLISHED');
        this.loadFlows();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_PUBLISH');
      },
    });
  }

  publishSaved(): void {
    const id = this.savedDefinitionId();
    if (!id) {
      return;
    }
    this.busy.set(true);
    this.api.publishDefinition(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.success.set('PLUGIN_WORKFLOW_FLOW_PUBLISHED');
        this.loadFlows();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_PUBLISH');
      },
    });
  }

  // ------------------------------------------------------------------
  // Runs / timeline
  // ------------------------------------------------------------------

  openRun(instance: WorkflowInstance): void {
    this.runLoading.set(true);
    this.api.progress(instance.id).subscribe({
      next: (result) => {
        this.runLoading.set(false);
        this.selectedRun.set(result.data ?? null);
      },
      error: () => {
        this.runLoading.set(false);
        this.error.set('PLUGIN_WORKFLOW_ERROR_RUN');
      },
    });
  }

  timeline(progress: InstanceProgress | null): WorkflowEvent[] {
    if (!progress) {
      return [];
    }
    if (progress.events && progress.events.length > 0) {
      return progress.events;
    }
    const items: WorkflowEvent[] = [
      {
        id: `${progress.instance.id}-start`,
        instance_id: progress.instance.id,
        event: 'INSTANCE_STARTED',
        created_at: progress.instance.created_at,
        payload: { trigger: progress.instance.trigger_type },
      },
    ];
    for (const task of progress.tasks ?? []) {
      items.push({
        id: task.id,
        instance_id: task.instance_id,
        task_id: task.id,
        event: `TASK_${task.status}`,
        created_at: task.due_at,
        payload: { node_id: task.node_id, mode: task.approval_mode },
      });
    }
    if (progress.instance.completed_at) {
      items.push({
        id: `${progress.instance.id}-end`,
        instance_id: progress.instance.id,
        event: 'INSTANCE_COMPLETED',
        created_at: progress.instance.completed_at,
        payload: { outcome: progress.instance.outcome },
      });
    }
    return items;
  }

  // ------------------------------------------------------------------
  // Display helpers
  // ------------------------------------------------------------------

  isOverdue(task: WorkflowTask): boolean {
    if (task.overdue_at) {
      return true;
    }
    return !!task.due_at && new Date(task.due_at).getTime() < Date.now();
  }

  taskVariant(task: WorkflowTask): ColorVariant {
    if (this.isOverdue(task) && task.status === 'PENDING') {
      return ColorVariant.DANGER;
    }
    switch (task.status) {
      case 'COMPLETED':
        return ColorVariant.SUCCESS;
      case 'PENDING':
        return ColorVariant.WARNING;
      case 'REJECTED':
      case 'CANCELLED':
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  flowVariant(status: string): ColorVariant {
    switch (status) {
      case 'PUBLISHED':
        return ColorVariant.SUCCESS;
      case 'ARCHIVED':
        return ColorVariant.WARNING;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  instanceVariant(status: string): ColorVariant {
    switch (status) {
      case 'COMPLETED':
        return ColorVariant.SUCCESS;
      case 'RUNNING':
        return ColorVariant.INFO;
      case 'CANCELLED':
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  eventVariant(event: WorkflowEvent): ColorVariant {
    if (event.event.includes('REJECT') || event.event.includes('OVERDUE')) {
      return ColorVariant.DANGER;
    }
    if (event.event.includes('COMPLETED') || event.event.includes('APPROVE')) {
      return ColorVariant.SUCCESS;
    }
    return ColorVariant.INFO;
  }

  statusLabel(status: string): string {
    return this.i18n.t(`PLUGIN_WORKFLOW_STATUS_${status}`);
  }

  modeLabel(mode: string): string {
    return this.i18n.t(`PLUGIN_WORKFLOW_MODE_${mode}`);
  }

  eventLabel(event: WorkflowEvent): string {
    return this.i18n.t(`PLUGIN_WORKFLOW_EVENT_${event.event}`);
  }

  eventDetail(event: WorkflowEvent): string {
    let payload: Record<string, unknown> = {};
    const raw = event.payload as unknown;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          payload = parsed as Record<string, unknown>;
        }
      } catch {
        return raw;
      }
    } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      payload = raw as Record<string, unknown>;
    }
    const parts: string[] = [];
    for (const [key, value] of Object.entries(payload)) {
      if (value != null && value !== '') {
        if (key === 'assignees' && Array.isArray(value)) {
          const labels = value.map((item) => this.userLabel(String(item)));
          parts.push(`${key}: ${labels.join(', ')}`);
        } else if (key === 'user_id' || key === 'actor_user_id' || key === 'to_user_id') {
          parts.push(`${key}: ${this.userLabel(String(value))}`);
        } else {
          parts.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
        }
      }
    }
    return parts.join(' · ');
  }

  formatDate(value: unknown): string {
    if (!value) {
      return '—';
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat(this.i18n.currentLang(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }

  shortId(id: string | undefined): string {
    return id ? id.slice(0, 8) : '—';
  }

  numText(value: unknown): string {
    return value == null ? '' : `${value}`;
  }

  nodeCount(definition: WorkflowDefinition): number {
    return definition.document?.nodes?.length ?? 0;
  }

  percentOf(part: number, total: number): number {
    return total <= 0 ? 0 : Math.min(100, Math.round((part / total) * 100));
  }

  canManageFlows(): boolean {
    return this.can('workflow:definition:manage');
  }

  private syncNodeJson(): void {
    const selected = this.selectedNode();
    this.nodeJson.set(selected ? JSON.stringify(selected, null, 2) : '');
  }

  private nextNodeId(type: NodeType): string {
    const base = type.toLowerCase();
    const ids = new Set(this.nodes().map((node) => node.id));
    let counter = 1;
    while (ids.has(`${base}_${counter}`)) {
      counter += 1;
    }
    return `${base}_${counter}`;
  }
}

function nextIdsOf(node: FlowNode): string[] {
  const next = node.next;
  if (Array.isArray(next)) {
    return next.map((entry) => String(entry));
  }
  return next ? [String(next)] : [];
}
