import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  CanvasComponent,
  CanvasNode,
  CanvasEdge,
  CanvasOptions,
  NodeType,
  NodeStatus,
  Assignee,
  IconComponent,
  ToastService,
} from '@open-erp/shared';

interface FormOption {
  id: string;
  formKey: string;
  name: string;
  fields?: any[];
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DeptOption {
  id: string;
  name: string;
}

interface RoleOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-workflow-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    IconComponent,
    CanvasComponent,
  ],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.css'],
})
export class WorkflowBuilderComponent implements OnInit {
  @ViewChild(CanvasComponent) canvasComp?: CanvasComponent;

  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly transloco = inject(TranslocoService);

  // ── Canvas States ───────────────────────────────────────────────────────
  nodes = signal<CanvasNode[]>([]);
  edges = signal<CanvasEdge[]>([]);
  options = signal<CanvasOptions>({
    readOnly: false,
    gridType: 'dots',
    snapToGrid: true,
    snapGridSize: 20,
    showToolbar: true,
    autoLayout: 'dagre',
    defaultEdgeType: 'bezier',
  });

  // ── Metadata States ─────────────────────────────────────────────────────
  workflowId = signal<string | null>(null);
  workflowName = signal<string>('Quy trình phê duyệt mới');
  workflowDescription = signal<string>('');

  // ── Selections ──────────────────────────────────────────────────────────
  selectedNode = signal<CanvasNode | null>(null);
  selectedEdge = signal<CanvasEdge | null>(null);

  // ── Dropdown Select Options ─────────────────────────────────────────────
  dynamicForms = signal<FormOption[]>([]);
  usersList = signal<UserOption[]>([]);
  deptsList = signal<DeptOption[]>([]);
  rolesList = signal<RoleOption[]>([]);
  workflowsList = signal<any[]>([]);

  // ── UI States ───────────────────────────────────────────────────────────
  activePropTab = signal<'general' | 'assignees' | 'form' | 'actions'>('general');
  isSaving = signal<boolean>(false);

  // Computed field list for selected dynamic form to help write conditions
  selectedFormFields = computed<any[]>(() => {
    const node = this.selectedNode();
    if (!node || node.type !== 'step') return [];
    const formId = node.data.meta?.['formId'] as string;
    if (!formId) return [];
    const form = this.dynamicForms().find((f) => f.id === formId);
    return form?.fields || [];
  });

  ngOnInit(): void {
    this.loadDropdownOptions();
    this.loadWorkflowsList();
    this.initDefaultGraph();
  }

  // ── Default Initialization ──────────────────────────────────────────────
  private initDefaultGraph(): void {
    const defaultNodes: CanvasNode[] = [
      {
        id: 'start_node',
        type: 'start',
        position: { x: 100, y: 150 },
        data: { label: 'START', status: 'idle' },
      },
      {
        id: 'step_node_1',
        type: 'step',
        position: { x: 300, y: 150 },
        data: {
          label: 'Phê duyệt bước 1',
          description: 'Cấu hình người duyệt và biểu mẫu',
          status: 'idle',
          meta: {
            consensusRule: 'ANY',
            consensusThreshold: 50,
            assignees: [],
            fallbackAssignee: { type: 'ROLE', value: '' },
            actions: [
              { name: 'Đồng ý', outcome: 'Approved' },
              { name: 'Từ chối', outcome: 'Rejected' },
            ],
          },
        },
      },
      {
        id: 'end_node',
        type: 'end',
        position: { x: 600, y: 150 },
        data: { label: 'END', status: 'idle' },
      },
    ];

    const defaultEdges: CanvasEdge[] = [
      {
        id: 'edge_start_to_step',
        sourceNodeId: 'start_node',
        targetNodeId: 'step_node_1',
        type: 'bezier',
        data: {},
      },
      {
        id: 'edge_step_to_end',
        sourceNodeId: 'step_node_1',
        targetNodeId: 'end_node',
        type: 'bezier',
        data: {},
      },
    ];

    this.nodes.set(defaultNodes);
    this.edges.set(defaultEdges);
  }

  // ── Load Selection lists from API ─────────────────────────────────────────
  private loadDropdownOptions(): void {
    // 1. Fetch latest dynamic forms
    this.http.get<any>('/api/v1/dynamic-forms').subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          this.dynamicForms.set(res.data);
        }
      },
    });

    // 2. Fetch users
    this.http.get<any>('/api/v1/org/users').subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          this.usersList.set(res.data);
        }
      },
    });

    // 3. Fetch flat departments list
    this.http.get<any>('/api/v1/org/departments/flat').subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          this.deptsList.set(res.data);
        }
      },
    });

    // 4. Fetch system roles
    this.http.get<any>('/api/v1/auth/roles').subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          this.rolesList.set(res.data);
        }
      },
    });
  }

  loadWorkflowsList(): void {
    this.http.get<any>('/api/v1/workflows').subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          this.workflowsList.set(res.data);
        }
      },
    });
  }

  // ── Canvas Event Handlers ────────────────────────────────────────────────
  onNodeClicked(node: CanvasNode): void {
    // Sync node reference with engine state
    const current = this.nodes().find((n) => n.id === node.id);
    this.selectedNode.set(current || node);
    this.selectedEdge.set(null);
  }

  onEdgeClicked(edge: CanvasEdge): void {
    const current = this.edges().find((e) => e.id === edge.id);
    this.selectedEdge.set(current || edge);
    this.selectedNode.set(null);
  }

  onSelectionChanged(selection: { nodeIds: string[]; edgeIds: string[] }): void {
    if (selection.nodeIds.length === 0 && selection.edgeIds.length === 0) {
      this.selectedNode.set(null);
      this.selectedEdge.set(null);
    }
  }

  onCanvasChanged(state: { nodes: CanvasNode[]; edges: CanvasEdge[] }): void {
    this.nodes.set(state.nodes);
    this.edges.set(state.edges);
  }

  // ── Add Nodes from Palette ───────────────────────────────────────────────
  addNodeFromPalette(type: NodeType): void {
    const label = type.toUpperCase();
    const id = `node_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    
    // Position slightly offset from current viewport center if canvasComp is active
    let x = 150 + Math.random() * 80;
    let y = 150 + Math.random() * 80;
    const viewport = this.canvasComp?.engine?.viewport();
    if (viewport) {
      // Center relative to current pan and zoom scale
      const centerX = 300;
      const centerY = 200;
      x = (centerX - viewport.x) / viewport.zoom;
      y = (centerY - viewport.y) / viewport.zoom;
    }

    const meta: Record<string, any> = {
      consensusRule: 'ANY',
      consensusThreshold: 50,
      assignees: [],
      fallbackAssignee: { type: 'ROLE', value: '' },
      actions: [
        { name: 'Đồng ý', outcome: 'Approved' },
        { name: 'Từ chối', outcome: 'Rejected' },
      ],
    };

    const newNode: CanvasNode = {
      id,
      type,
      position: { x, y },
      data: {
        label: `${label} step`,
        description: `Mô tả cho ${type}`,
        status: 'idle',
        meta: type === 'step' || type === 'gateway' ? meta : {},
      },
    };

    this.nodes.update((ns) => [...ns, newNode]);
    this.selectedNode.set(newNode);
    this.selectedEdge.set(null);
  }

  // ── Update selected node properties ──────────────────────────────────────
  updateNodeData(prop: string, val: any): void {
    const active = this.selectedNode();
    if (!active) return;

    this.nodes.update((ns) =>
      ns.map((n) => {
        if (n.id === active.id) {
          const updated = {
            ...n,
            data: {
              ...n.data,
              [prop]: val,
            },
          };
          this.selectedNode.set(updated);
          return updated;
        }
        return n;
      })
    );
  }

  updateNodeMeta(prop: string, val: any): void {
    const active = this.selectedNode();
    if (!active) return;

    this.nodes.update((ns) =>
      ns.map((n) => {
        if (n.id === active.id) {
          const updated = {
            ...n,
            data: {
              ...n.data,
              meta: {
                ...(n.data.meta || {}),
                [prop]: val,
              },
            },
          };
          this.selectedNode.set(updated);
          return updated;
        }
        return n;
      })
    );
  }

  // Assignees selection helpers
  onAssigneeChange(event: Event, type: 'USER' | 'DEPARTMENT' | 'ROLE'): void {
    const select = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(select.selectedOptions).map((o) => o.value);
    
    // Get existing assignees of other types
    const meta = this.selectedNode()?.data.meta || {};
    const assignees = (meta['assignees'] || []) as any[];
    const otherAssignees = assignees.filter((a) => a.type !== type);
    
    // Add new selections
    const newAssignees = [
      ...otherAssignees,
      ...selectedOptions.map((val) => ({ type, value: val })),
    ];
    this.updateNodeMeta('assignees', newAssignees);
  }

  getAssigneeSelectedValues(type: 'USER' | 'DEPARTMENT' | 'ROLE'): string[] {
    const meta = this.selectedNode()?.data.meta || {};
    const assignees = (meta['assignees'] || []) as any[];
    return assignees.filter((a) => a.type === type).map((a) => a.value);
  }

  onFallbackTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const type = select.value;
    const meta = this.selectedNode()?.data.meta || {};
    const fallback = meta['fallbackAssignee'] || { type: 'ROLE', value: '' };
    this.updateNodeMeta('fallbackAssignee', { ...fallback, type, value: '' });
  }

  onFallbackValueChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    const meta = this.selectedNode()?.data.meta || {};
    const fallback = meta['fallbackAssignee'] || { type: 'ROLE', value: '' };
    this.updateNodeMeta('fallbackAssignee', { ...fallback, value });
  }

  // Actions list configuration helpers
  addActionItem(): void {
    const meta = this.selectedNode()?.data.meta || {};
    const actions = [...((meta['actions'] as any[]) || [])] as any[];
    actions.push({ name: 'Hành động mới', outcome: 'OutcomeNew' });
    this.updateNodeMeta('actions', actions);
  }

  removeActionItem(idx: number): void {
    const meta = this.selectedNode()?.data.meta || {};
    const actions = [...((meta['actions'] as any[]) || [])] as any[];
    actions.splice(idx, 1);
    this.updateNodeMeta('actions', actions);
  }

  updateActionItem(idx: number, field: 'name' | 'outcome', event: Event): void {
    const input = event.target as HTMLInputElement;
    const meta = this.selectedNode()?.data.meta || {};
    const actions = JSON.parse(JSON.stringify((meta['actions'] as any[]) || [])) as any[];
    actions[idx][field] = input.value;
    this.updateNodeMeta('actions', actions);
  }

  getFallbackAssigneeType(): string {
    const node = this.selectedNode();
    const fallback = node?.data?.meta?.['fallbackAssignee'] as any;
    return fallback?.type || 'ROLE';
  }

  getFallbackAssigneeValue(): string {
    const node = this.selectedNode();
    const fallback = node?.data?.meta?.['fallbackAssignee'] as any;
    return fallback?.value || '';
  }

  getSelectedNodeActions(): any[] {
    const node = this.selectedNode();
    return (node?.data?.meta?.['actions'] as any[]) || [];
  }

  // ── Edge properties configuration ────────────────────────────────────────
  updateEdgeData(prop: string, val: any): void {
    const active = this.selectedEdge();
    if (!active) return;

    this.edges.update((es) =>
      es.map((e) => {
        if (e.id === active.id) {
          const updated = {
            ...e,
            data: {
              ...e.data,
              [prop]: val,
            },
          };
          this.selectedEdge.set(updated);
          return updated;
        }
        return e;
      })
    );
  }

  // ── Save Workflow (Convert Canvas Graph to flat backend steps schema) ──────
  saveWorkflow(): void {
    const name = this.workflowName().trim();
    if (!name) {
      this.toastService.showError(this.transloco.translate('workflow.name_required') || 'Tên quy trình không được để trống.');
      return;
    }

    const canvasNodes = this.nodes();
    const canvasEdges = this.edges();

    // Validate has at least START and END step
    const hasStart = canvasNodes.some((n) => n.type === 'start');
    const hasEnd = canvasNodes.some((n) => n.type === 'end');
    if (!hasStart || !hasEnd) {
      this.toastService.showError('Sơ đồ phải có tối thiểu 1 node Bắt Đầu (START) và 1 node Kết Thúc (END).');
      return;
    }

    this.isSaving.set(true);

    // Convert nodes to DTO steps
    const steps = canvasNodes.map((node, index) => {
      // stepType matching backend StepType
      let stepType = 'APPROVAL';
      if (node.type === 'start') stepType = 'START';
      else if (node.type === 'end') stepType = 'END';
      else if (node.type === 'fork') stepType = 'FORK';
      else if (node.type === 'join') stepType = 'JOIN';
      else if (node.type === 'gateway') stepType = 'APPROVAL';

      // Find next steps IDs using edges
      const nextIds = canvasEdges
        .filter((e) => e.sourceNodeId === node.id)
        .map((e) => e.targetNodeId);

      // Extract config properties
      const meta = node.data.meta || {};
      const formId = meta['formId'] || null;

      // Extract assignees list
      const assignees = meta['assignees'] || [];

      // Determine routing condition
      // For each outgoing edge from this step, we evaluate if we store the condition in the target node config.
      // In the backend, the condition is evaluated at the target step's config.
      // So if B is next, B's config contains the condition to enter B.
      // Let's copy B's incoming edge condition (if any) into B's config.condition.
      let condition = null;
      const incomingEdges = canvasEdges.filter((e) => e.targetNodeId === node.id);
      if (incomingEdges.length > 0) {
        // If there's an incoming edge with a condition, save it
        condition = incomingEdges[0].data?.['condition'] || null;
      }

      const stepConfig = {
        description: node.data.description || '',
        consensusRule: meta['consensusRule'] || 'ANY',
        consensusThreshold: meta['consensusThreshold'] || 50,
        assignees,
        fallbackAssignee: meta['fallbackAssignee'] || null,
        actions: meta['actions'] || [],
        condition,
        visual: {
          type: node.type,
          position: node.position,
        },
      };

      return {
        id: node.id,
        name: node.data.label || node.id,
        stepOrder: index + 1,
        stepType,
        nextStepIds: nextIds,
        formId,
        config: stepConfig,
      };
    });

    const payload = {
      name,
      description: this.workflowDescription(),
      steps,
    };

    const url = this.workflowId() 
      ? `/api/v1/workflows/${this.workflowId()}` // If backend supports PUT/PATCH.
      : '/api/v1/workflows';

    this.http.post<any>('/api/v1/workflows', payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res?.success) {
          this.toastService.showSuccess('Lưu thiết kế quy trình thành công!');
          this.loadWorkflowsList();
          if (res.data?.workflowId && !this.workflowId()) {
            this.workflowId.set(res.data.workflowId);
          }
        } else {
          this.toastService.showError('Lưu quy trình thất bại: ' + (res?.message || 'Lỗi không xác định'));
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.showError('Lỗi kết nối đến máy chủ.');
      },
    });
  }

  // ── Load existing Workflow from Backend (Convert steps back to Graph) ─────
  loadWorkflow(id: string): void {
    if (!id) return;
    this.http.get<any>(`/api/v1/workflows/${id}`).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const workflow = res.data;
          this.workflowId.set(workflow.id);
          this.workflowName.set(workflow.name);
          this.workflowDescription.set(workflow.description || '');

          const steps = workflow.steps || [];
          const newNodes: CanvasNode[] = [];
          const newEdges: CanvasEdge[] = [];

          // 1. Create nodes
          steps.forEach((step: any) => {
            const visual = step.config?.visual || {};
            const position = visual.position || { x: 100, y: 100 };
            const type = visual.type || (step.stepType?.toLowerCase() as NodeType);

            const meta = {
              consensusRule: step.config?.consensusRule || 'ANY',
              consensusThreshold: step.config?.consensusThreshold || 50,
              assignees: step.config?.assignees || step.assignees?.map((a: any) => ({ type: a.assigneeType, value: a.assigneeId })) || [],
              fallbackAssignee: step.config?.fallbackAssignee || { type: 'ROLE', value: '' },
              actions: step.config?.actions || [
                { name: 'Đồng ý', outcome: 'Approved' },
                { name: 'Từ chối', outcome: 'Rejected' },
              ],
              formId: step.formId || '',
            };

            newNodes.push({
              id: step.id,
              type,
              position,
              data: {
                label: step.name,
                description: step.config?.description || '',
                status: 'idle',
                meta,
              },
            });
          });

          // 2. Create edges
          steps.forEach((step: any) => {
            const nextIds = step.nextStepIds || [];
            nextIds.forEach((nextId: string) => {
              // Find if the target step has a condition configured
              const targetStep = steps.find((s: any) => s.id === nextId);
              const condition = targetStep?.config?.condition || '';

              newEdges.push({
                id: `edge_${step.id}_to_${nextId}`,
                sourceNodeId: step.id,
                targetNodeId: nextId,
                type: 'bezier',
                data: {
                  condition,
                  label: condition ? 'Condition' : '',
                },
              });
            });
          });

          this.nodes.set(newNodes);
          this.edges.set(newEdges);
          this.selectedNode.set(null);
          this.selectedEdge.set(null);
          this.toastService.showSuccess('Đã tải thành công sơ đồ quy trình.');
        }
      },
      error: () => {
        this.toastService.showError('Tải quy trình thất bại.');
      },
    });
  }

  // Reset to empty / new workflow
  newWorkflow(): void {
    this.workflowId.set(null);
    this.workflowName.set('Quy trình phê duyệt mới');
    this.workflowDescription.set('');
    this.initDefaultGraph();
    this.selectedNode.set(null);
    this.selectedEdge.set(null);
  }
}
