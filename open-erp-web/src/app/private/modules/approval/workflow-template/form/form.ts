import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';

// ngx-vflow
import {
  Vflow,
  Node as VflowNode,
  Edge as VflowEdge,
  StaticNode,
  StaticEdge,
  createNodes,
  createEdges,
  Connection,
  ConnectionSettings,
  ReconnectEvent,
  EdgeSelectChange,
  NodeSelectedChange,
} from 'ngx-vflow';

// Core toolbar
import { MpToolbar } from '../../../../../../core/components/toolbar';

// Core services
import {
  WorkflowTemplateService,
  WorkflowTemplate,
  WorkflowNode,
  WorkflowEdge,
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  ApprovalScope,
  TemplateStatus,
  WorkflowNodeType,
  ApprovalMode,
} from '../../../../../../core/services/workflow-template/workflow-template.service';

interface ScopeOption {
  label: string;
  value: string;
}

interface VflowNodeData {
  label: string;
  nodeType: WorkflowNodeType;
  description?: string;
  approverIds?: string[];
  approvalMode?: ApprovalMode;
  quorumCount?: number;
  timeoutHours?: number;
}

interface HandleDef {
  id: string;
  type: 'source' | 'target';
  position: 'left' | 'right' | 'top' | 'bottom';
  offsetY: number;
}

@Component({
  selector: 'approval-workflow-template-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    Select,
    DividerModule,
    TooltipModule,
    TagModule,
    DialogModule,
    ContextMenuModule,
    ConfirmDialogModule,
    InputNumberModule,
    MpToolbar,
    ...Vflow,
  ],
  providers: [ConfirmationService],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowTemplateForm implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly templateService = inject(WorkflowTemplateService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('nodeContextMenu') nodeContextMenu!: ContextMenu;

  protected readonly template = signal<WorkflowTemplate | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly isViewMode = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly isMobile = signal(false);
  private resizeHandler: (() => void) | null = null;
  private edgeIdCounter = 0;

  // ngx-vflow nodes and edges
  protected vflowNodes = signal<VflowNode<VflowNodeData>[]>([]);
  protected vflowEdges = signal<VflowEdge[]>([]);

  // Selected entities for deletion
  protected readonly selectedEdgeIds = signal<Set<string>>(new Set());
  protected readonly selectedNodeIds = signal<Set<string>>(new Set());

  // Mobile sidebar
  protected readonly showMobileSidebar = signal(false);

  // Manual edge creation (sidebar dropdown-based)
  protected readonly edgeSourceId = signal<string>('');
  protected readonly edgeTargetId = signal<string>('');

  // Node options for edge creation dropdown
  // Note: ngx-vflow's VflowNode union type doesn't expose `data` directly;
  // at runtime, `data` is a WritableSignal when nodes are initialized via createNodes().
  protected readonly nodeOptions = computed(() => {
    return this.vflowNodes().map((n) => {
      const dataSignal = (n as unknown as Record<string, unknown>)['data'];
      const data =
        typeof dataSignal === 'function'
          ? (dataSignal as () => VflowNodeData)()
          : (dataSignal as VflowNodeData | undefined);
      return {
        label: `${data?.label || 'Node'} (${n.id})`,
        value: n.id,
      };
    });
  });

  // Node settings dialog
  protected readonly showNodeDialog = signal(false);
  protected readonly editingNodeId = signal<string | null>(null);
  protected nodeForm!: FormGroup;

  // Context menu for nodes
  protected readonly contextMenuNode = signal<VflowNode<VflowNodeData> | null>(null);
  protected nodeMenuItems: MenuItem[] = [];

  // Computed flow summary
  protected readonly nodesCount = computed(() => this.vflowNodes().length);
  protected readonly edgesCount = computed(() => this.vflowEdges().length);

  protected readonly scopeOptions: ScopeOption[] = [
    { label: 'Global', value: ApprovalScope.GLOBAL },
    { label: 'Organization', value: ApprovalScope.ORG },
    { label: 'Department', value: ApprovalScope.DEPARTMENT },
  ];

  protected readonly approvalModeOptions: ScopeOption[] = [
    { label: 'Any', value: ApprovalMode.ANY },
    { label: 'All', value: ApprovalMode.ALL },
    { label: 'Quorum', value: ApprovalMode.QUORUM },
  ];

  // Expose enum values for template
  protected readonly WorkflowNodeType = WorkflowNodeType;
  protected readonly TemplateStatus = TemplateStatus;
  protected readonly ApprovalMode = ApprovalMode;

  // Connection settings - allow multiple edges per handle, loose mode
  protected readonly connectionSettings: ConnectionSettings = {
    mode: 'loose',
    curve: 'bezier',
  };

  protected form!: FormGroup;

  constructor() {
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: ['', Validators.maxLength(500)],
      entityType: ['', [Validators.required, Validators.minLength(2)]],
      scope: [ApprovalScope.GLOBAL, [Validators.required]],
      orgId: [''],
      departmentId: [''],
    });

    this.nodeForm = this.fb.group({
      label: ['', [Validators.required]],
      description: [''],
      approvalMode: [ApprovalMode.ANY],
      approverIds: [''],
      quorumCount: [null],
      timeoutHours: [null],
    });

    this.buildNodeContextMenu();

    const routePath = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.isViewMode.set(routePath === 'view');
    this.isEditMode.set(routePath === 'edit');

    // Subscribe to route data (resolver is directly on this route)
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['workflowTemplate']) {
        this.loadTemplateData(data['workflowTemplate'] as WorkflowTemplate);
      }
    });

    // Initialize default flow for new templates
    if (!this.isEditMode() && !this.isViewMode()) {
      this.initializeDefaultFlow();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isViewMode()) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Don't delete if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (this.selectedEdgeIds().size > 0 || this.selectedNodeIds().size > 0) {
        event.preventDefault();
        this.deleteSelectedEntities();
      }
    }
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  private buildNodeContextMenu(): void {
    this.nodeMenuItems = [
      {
        label: this.translocoService.translate('workflowTemplate.form.nodeMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.openNodeSettings(this.contextMenuNode()),
      },
      {
        label: this.translocoService.translate('workflowTemplate.form.nodeMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.deleteNode(this.contextMenuNode()),
      },
    ];
  }

  private loadTemplateData(wfTemplate: WorkflowTemplate | null | undefined): void {
    if (!wfTemplate) return;

    this.template.set(wfTemplate);

    this.form.patchValue({
      name: wfTemplate.name,
      description: wfTemplate.description || '',
      entityType: wfTemplate.entityType,
      scope: wfTemplate.scope,
      orgId: wfTemplate.orgId || '',
      departmentId: wfTemplate.departmentId || '',
    });

    // Load nodes/edges into vflow
    if (wfTemplate.nodes && wfTemplate.nodes.length > 0) {
      this.loadFlowFromTemplate(wfTemplate.nodes, wfTemplate.edges || []);
    } else {
      this.initializeDefaultFlow();
    }

    if (this.isViewMode()) {
      this.form.disable();
    }
  }

  private loadFlowFromTemplate(nodes: WorkflowNode[], edges: WorkflowEdge[]): void {
    const staticNodes: StaticNode<VflowNodeData>[] = nodes.map((node) => ({
      id: node.id,
      point: { x: node.point.x, y: node.point.y },
      type: 'html-template' as const,
      data: {
        label: node.data?.label || node.type,
        nodeType: node.type as WorkflowNodeType,
        description: node.data?.description,
        approverIds: node.data?.approverIds,
        approvalMode: node.data?.approvalMode,
        quorumCount: node.data?.quorumCount,
        timeoutHours: node.data?.timeoutHours,
      },
    }));

    const staticEdges: StaticEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      reconnectable: true,
    }));

    this.vflowNodes.set(createNodes(staticNodes));
    this.vflowEdges.set(createEdges(staticEdges));
  }

  private initializeDefaultFlow(): void {
    const defaultNodes: StaticNode<VflowNodeData>[] = [
      {
        id: 'start-1',
        point: { x: 50, y: 200 },
        type: 'html-template' as const,
        data: { label: 'Start', nodeType: WorkflowNodeType.START },
      },
      {
        id: 'approval-1',
        point: { x: 350, y: 200 },
        type: 'html-template' as const,
        data: {
          label: 'Approval Step',
          nodeType: WorkflowNodeType.APPROVAL,
          approverIds: [],
          approvalMode: ApprovalMode.ANY,
        },
      },
      {
        id: 'end-1',
        point: { x: 650, y: 200 },
        type: 'html-template' as const,
        data: { label: 'End', nodeType: WorkflowNodeType.END },
      },
    ];

    const defaultEdges: StaticEdge[] = [
      { id: 'e1', source: 'start-1', target: 'approval-1', reconnectable: true },
      { id: 'e2', source: 'approval-1', target: 'end-1', reconnectable: true },
    ];

    this.vflowNodes.set(createNodes(defaultNodes));
    this.vflowEdges.set(createEdges(defaultEdges));
  }

  protected addNode(type: WorkflowNodeType): void {
    if (this.isViewMode()) return;

    const count = this.vflowNodes().length;
    const id = `${type}-${Date.now()}`;
    const label =
      type === WorkflowNodeType.APPROVAL
        ? 'Approval Step'
        : type === WorkflowNodeType.CONDITION
          ? 'Condition'
          : type === WorkflowNodeType.END
            ? 'End'
            : 'Start';

    const data: VflowNodeData = {
      label,
      nodeType: type,
    };
    if (type === WorkflowNodeType.APPROVAL) {
      data.approverIds = [];
      data.approvalMode = ApprovalMode.ANY;
    }

    const newNode: StaticNode<VflowNodeData> = {
      id,
      point: { x: 100 + count * 50, y: 100 + count * 30 },
      type: 'html-template' as const,
      data,
    };

    this.vflowNodes.set([...this.vflowNodes(), ...createNodes([newNode])]);
  }

  /**
   * Create edge manually from sidebar dropdowns
   */
  protected addEdgeManually(): void {
    if (this.isViewMode()) return;
    const source = this.edgeSourceId();
    const target = this.edgeTargetId();
    if (!source || !target || source === target) return;

    const newEdge: StaticEdge = {
      id: `e-${Date.now()}-${++this.edgeIdCounter}`,
      source,
      target,
      reconnectable: true,
    };

    this.vflowEdges.set([...this.vflowEdges(), ...createEdges([newEdge])]);
    this.edgeSourceId.set('');
    this.edgeTargetId.set('');
  }

  /**
   * Get handle definitions for a given node type.
   * Different node types have different numbers of source/target handles.
   */
  protected getHandlesForNodeType(nodeType: WorkflowNodeType): HandleDef[] {
    switch (nodeType) {
      case WorkflowNodeType.START:
        // Start: 1 source (right), no target
        return [{ id: 'source-1', type: 'source', position: 'right', offsetY: 0 }];
      case WorkflowNodeType.END:
        // End: 1 target (left), no source
        return [{ id: 'target-1', type: 'target', position: 'left', offsetY: 0 }];
      case WorkflowNodeType.APPROVAL:
        // Approval: 1 target (left), 2 sources (right, offset)
        return [
          { id: 'target-1', type: 'target', position: 'left', offsetY: 0 },
          { id: 'source-1', type: 'source', position: 'right', offsetY: -8 },
          { id: 'source-2', type: 'source', position: 'right', offsetY: 8 },
        ];
      case WorkflowNodeType.CONDITION:
        // Condition: 1 target (left), 3 sources (right, offset for yes/no/else)
        return [
          { id: 'target-1', type: 'target', position: 'left', offsetY: 0 },
          { id: 'source-1', type: 'source', position: 'right', offsetY: -12 },
          { id: 'source-2', type: 'source', position: 'right', offsetY: 0 },
          { id: 'source-3', type: 'source', position: 'right', offsetY: 12 },
        ];
      default:
        return [
          { id: 'target-1', type: 'target', position: 'left', offsetY: 0 },
          { id: 'source-1', type: 'source', position: 'right', offsetY: 0 },
        ];
    }
  }

  /**
   * Handle new edge connection from user dragging between handles
   */
  protected onConnect(connection: Connection): void {
    if (this.isViewMode()) return;

    const newEdge: StaticEdge = {
      id: `e-${Date.now()}-${++this.edgeIdCounter}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      reconnectable: true,
    };

    this.vflowEdges.set([...this.vflowEdges(), ...createEdges([newEdge])]);
  }

  /**
   * Handle edge reconnection (dragging an existing edge to a different node)
   */
  protected onReconnect(event: ReconnectEvent): void {
    if (this.isViewMode()) return;

    const oldEdgeId = event.oldEdge.id;
    const updatedStaticEdge: StaticEdge = {
      id: oldEdgeId,
      source: event.connection.source,
      target: event.connection.target,
      sourceHandle: event.connection.sourceHandle,
      targetHandle: event.connection.targetHandle,
      reconnectable: true,
    };
    const [newEdge] = createEdges([updatedStaticEdge]);
    const updatedEdges = this.vflowEdges().map((e) => (e.id === oldEdgeId ? newEdge : e));
    this.vflowEdges.set(updatedEdges);
  }

  /**
   * Handle edge selection changes — track selected edges for deletion
   */
  protected onEdgeSelect(changes: EdgeSelectChange[]): void {
    const selected = new Set(this.selectedEdgeIds());
    for (const change of changes) {
      if (change.selected) {
        selected.add(change.id);
      } else {
        selected.delete(change.id);
      }
    }
    this.selectedEdgeIds.set(selected);
  }

  /**
   * Handle node selection changes — track selected nodes for deletion
   */
  protected onNodeSelect(changes: NodeSelectedChange[]): void {
    const selected = new Set(this.selectedNodeIds());
    for (const change of changes) {
      if (change.selected) {
        selected.add(change.id);
      } else {
        selected.delete(change.id);
      }
    }
    this.selectedNodeIds.set(selected);
  }

  /**
   * Delete all selected edges and nodes (triggered by Delete key)
   */
  private deleteSelectedEntities(): void {
    const edgeIds = this.selectedEdgeIds();
    const nodeIds = this.selectedNodeIds();

    if (edgeIds.size > 0) {
      this.vflowEdges.set(this.vflowEdges().filter((e) => !edgeIds.has(e.id)));
      this.selectedEdgeIds.set(new Set());
    }

    if (nodeIds.size > 0) {
      this.vflowNodes.set(this.vflowNodes().filter((n) => !nodeIds.has(n.id)));
      // Also remove edges connected to deleted nodes
      this.vflowEdges.set(
        this.vflowEdges().filter((e) => {
          const source = typeof e.source === 'function' ? (e.source as () => string)() : e.source;
          const target = typeof e.target === 'function' ? (e.target as () => string)() : e.target;
          return !nodeIds.has(source as string) && !nodeIds.has(target as string);
        }),
      );
      this.selectedNodeIds.set(new Set());
    }
  }

  /**
   * Open node context menu on right-click
   */
  protected onNodeContextMenu(event: MouseEvent, node: VflowNode<VflowNodeData>): void {
    if (this.isViewMode()) return;
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuNode.set(node);
    this.buildNodeContextMenu();
    this.nodeContextMenu.show(event);
  }

  /**
   * Open node settings dialog
   */
  protected openNodeSettings(node: VflowNode<VflowNodeData> | null): void {
    if (!node || this.isViewMode()) return;
    this.editingNodeId.set(node.id);

    const nodeAny = node as any;
    const data = typeof nodeAny.data === 'function' ? nodeAny.data() : nodeAny.data;

    this.nodeForm.patchValue({
      label: data?.label || '',
      description: data?.description || '',
      approvalMode: data?.approvalMode || ApprovalMode.ANY,
      approverIds: (data?.approverIds || []).join(', '),
      quorumCount: data?.quorumCount || null,
      timeoutHours: data?.timeoutHours || null,
    });

    this.showNodeDialog.set(true);
  }

  /**
   * Save node settings from dialog
   */
  protected saveNodeSettings(): void {
    const nodeId = this.editingNodeId();
    if (!nodeId) return;

    const formVal = this.nodeForm.getRawValue();
    const currentNodes = this.vflowNodes();
    const nodeIndex = currentNodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = currentNodes[nodeIndex] as any;
    const existingData = typeof node.data === 'function' ? node.data() : node.data;

    // Parse approverIds from comma-separated string to array
    const approverIds =
      typeof formVal.approverIds === 'string'
        ? formVal.approverIds
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        : formVal.approverIds || [];

    // Update the data signal
    if (typeof node.data === 'function' && typeof node.data.set === 'function') {
      node.data.set({
        ...existingData,
        label: formVal.label,
        description: formVal.description,
        approvalMode: formVal.approvalMode,
        approverIds,
        quorumCount: formVal.quorumCount,
        timeoutHours: formVal.timeoutHours,
      });
    }

    this.showNodeDialog.set(false);
    this.editingNodeId.set(null);
  }

  /**
   * Delete a specific node
   */
  protected deleteNode(node: VflowNode<VflowNodeData> | null): void {
    if (!node || this.isViewMode()) return;
    const nodeId = node.id;

    this.vflowNodes.set(this.vflowNodes().filter((n) => n.id !== nodeId));
    // Remove connected edges
    this.vflowEdges.set(
      this.vflowEdges().filter((e) => {
        const source = typeof e.source === 'function' ? (e.source as () => string)() : e.source;
        const target = typeof e.target === 'function' ? (e.target as () => string)() : e.target;
        return source !== nodeId && target !== nodeId;
      }),
    );
  }

  /**
   * Delete the selected edge (shortcut button)
   */
  protected deleteSelectedEdges(): void {
    const edgeIds = this.selectedEdgeIds();
    if (edgeIds.size === 0) return;
    this.vflowEdges.set(this.vflowEdges().filter((e) => !edgeIds.has(e.id)));
    this.selectedEdgeIds.set(new Set());
  }

  /**
   * Get the node type of the currently editing node
   */
  protected getEditingNodeType(): WorkflowNodeType | null {
    const nodeId = this.editingNodeId();
    if (!nodeId) return null;
    const node = this.vflowNodes().find((n) => n.id === nodeId) as any;
    if (!node) return null;
    const data = typeof node.data === 'function' ? node.data() : node.data;
    return data?.nodeType || null;
  }

  private extractNodesAndEdges(): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  } {
    const nodes: WorkflowNode[] = this.vflowNodes().map((n) => {
      // ngx-vflow uses WritableSignal for point and data - read via function call
      const pointSignal = n.point;
      const point = typeof pointSignal === 'function' ? pointSignal() : pointSignal;
      const dataSignal = (n as VflowNode<VflowNodeData> & { data?: any }).data;
      const data: VflowNodeData | undefined =
        typeof dataSignal === 'function' ? dataSignal() : dataSignal;
      return {
        id: n.id,
        point: { x: point.x, y: point.y },
        type: (data?.nodeType || WorkflowNodeType.APPROVAL) as WorkflowNodeType,
        data: {
          label: data?.label,
          description: data?.description,
          approverIds: data?.approverIds,
          approvalMode: data?.approvalMode,
          quorumCount: data?.quorumCount,
          timeoutHours: data?.timeoutHours,
        },
      };
    });

    const edges: WorkflowEdge[] = this.vflowEdges().map((e) => {
      const sourceVal = typeof e.source === 'function' ? (e.source as () => string)() : e.source;
      const targetVal = typeof e.target === 'function' ? (e.target as () => string)() : e.target;
      return {
        id: e.id,
        source: sourceVal as string,
        target: targetVal as string,
      };
    });

    return { nodes, edges };
  }

  protected onSave(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach((key) => {
        const control = this.form.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('workflowTemplate.messages.error'),
        detail: this.translocoService.translate('workflowTemplate.messages.validationFailed'),
      });
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();
    const { nodes, edges } = this.extractNodesAndEdges();

    const existingTemplate = this.template();

    if (existingTemplate) {
      const dto: UpdateWorkflowTemplateDto = {
        name: formValue.name,
        description: formValue.description || undefined,
        entityType: formValue.entityType,
        scope: formValue.scope,
        orgId: formValue.orgId || undefined,
        departmentId: formValue.departmentId || undefined,
        nodes,
        edges,
      };

      this.templateService.updateTemplate(existingTemplate._id, dto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('workflowTemplate.messages.success'),
            detail: this.translocoService.translate('workflowTemplate.messages.updateSuccess'),
          });
          this.onClose();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('workflowTemplate.messages.error'),
            detail:
              error?.error?.message ||
              this.translocoService.translate('workflowTemplate.messages.saveFailed'),
          });
          this.isLoading.set(false);
        },
      });
    } else {
      const dto: CreateWorkflowTemplateDto = {
        name: formValue.name,
        description: formValue.description || undefined,
        entityType: formValue.entityType,
        scope: formValue.scope,
        orgId: formValue.orgId || undefined,
        departmentId: formValue.departmentId || undefined,
        nodes,
        edges,
      };

      this.templateService.createTemplate(dto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('workflowTemplate.messages.success'),
            detail: this.translocoService.translate('workflowTemplate.messages.createSuccess'),
          });
          this.onClose();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('workflowTemplate.messages.error'),
            detail:
              error?.error?.message ||
              this.translocoService.translate('workflowTemplate.messages.saveFailed'),
          });
          this.isLoading.set(false);
        },
      });
    }
  }

  /**
   * Toolbar actions for existing templates
   */
  protected onDelete(): void {
    const t = this.template();
    if (!t) return;
    this.confirmationService.confirm({
      message: this.translocoService.translate('workflowTemplate.confirmDelete.message', {
        name: t.name,
      }),
      header: this.translocoService.translate('workflowTemplate.confirmDelete.header'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.isLoading.set(true);
        this.templateService.deleteTemplate(t._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('workflowTemplate.messages.success'),
              detail: this.translocoService.translate('workflowTemplate.messages.deleteSuccess', {
                name: t.name,
              }),
            });
            this.onClose();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('workflowTemplate.messages.error'),
              detail: this.translocoService.translate('workflowTemplate.messages.deleteFailed'),
            });
            this.isLoading.set(false);
          },
        });
      },
    });
  }

  protected onPublish(): void {
    const t = this.template();
    if (!t) return;
    this.isLoading.set(true);
    this.templateService.publishTemplate(t._id).subscribe({
      next: (updated) => {
        this.template.set(updated);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('workflowTemplate.messages.success'),
          detail: this.translocoService.translate('workflowTemplate.messages.publishSuccess'),
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('workflowTemplate.messages.error'),
          detail: this.translocoService.translate('workflowTemplate.messages.publishFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  protected onUnpublish(): void {
    const t = this.template();
    if (!t) return;
    this.isLoading.set(true);
    this.templateService.changeStatus(t._id, TemplateStatus.DRAFT).subscribe({
      next: (updated) => {
        this.template.set(updated);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('workflowTemplate.messages.success'),
          detail: this.translocoService.translate('workflowTemplate.messages.unpublishSuccess'),
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('workflowTemplate.messages.error'),
          detail: this.translocoService.translate('workflowTemplate.messages.unpublishFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  protected onArchive(): void {
    const t = this.template();
    if (!t) return;
    this.isLoading.set(true);
    this.templateService.archiveTemplate(t._id).subscribe({
      next: (updated) => {
        this.template.set(updated);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('workflowTemplate.messages.success'),
          detail: this.translocoService.translate('workflowTemplate.messages.archiveSuccess'),
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('workflowTemplate.messages.error'),
          detail: this.translocoService.translate('workflowTemplate.messages.archiveFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  protected onDuplicate(): void {
    const t = this.template();
    if (!t) return;
    this.isLoading.set(true);
    const cloneName = this.translocoService.translate('workflowTemplate.messages.cloneSuffix', {
      name: t.name,
    });
    this.templateService.cloneTemplate(t._id, { name: cloneName }).subscribe({
      next: (cloned) => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('workflowTemplate.messages.success'),
          detail: this.translocoService.translate('workflowTemplate.messages.cloneSuccess'),
        });
        // Navigate to edit the cloned template
        this.router.navigate(['../../', cloned._id, 'edit'], { relativeTo: this.route });
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('workflowTemplate.messages.error'),
          detail: this.translocoService.translate('workflowTemplate.messages.cloneFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  protected onClose(): void {
    // Navigate back to the list: from /new → ../-/1/100, from /:id/edit or /:id/view → ../../-/1/100
    if (this.template()) {
      this.router.navigate(['../../-/1/100'], { relativeTo: this.route });
    } else {
      this.router.navigate(['../-/1/100'], { relativeTo: this.route });
    }
  }

  protected getStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case TemplateStatus.PUBLISHED:
        return 'success';
      case TemplateStatus.DRAFT:
        return 'warn';
      case TemplateStatus.ARCHIVED:
        return 'secondary';
      default:
        return 'info';
    }
  }

  protected getNodeColor(nodeType: WorkflowNodeType): string {
    switch (nodeType) {
      case WorkflowNodeType.START:
        return '#22c55e';
      case WorkflowNodeType.APPROVAL:
        return '#3b82f6';
      case WorkflowNodeType.CONDITION:
        return '#f59e0b';
      case WorkflowNodeType.END:
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  protected getNodeIcon(nodeType: WorkflowNodeType): string {
    switch (nodeType) {
      case WorkflowNodeType.START:
        return 'pi pi-play';
      case WorkflowNodeType.APPROVAL:
        return 'pi pi-check-circle';
      case WorkflowNodeType.CONDITION:
        return 'pi pi-code';
      case WorkflowNodeType.END:
        return 'pi pi-stop-circle';
      default:
        return 'pi pi-circle';
    }
  }
}
