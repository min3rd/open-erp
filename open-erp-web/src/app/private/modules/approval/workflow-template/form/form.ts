import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

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

@Component({
  selector: 'approval-workflow-template-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    Select,
    DividerModule,
    TooltipModule,
    TagModule,
    MpToolbar,
    ...Vflow,
  ],
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
  private readonly destroy$ = new Subject<void>();

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

  // Computed flow summary
  protected readonly nodesCount = computed(() => this.vflowNodes().length);
  protected readonly edgesCount = computed(() => this.vflowEdges().length);

  protected readonly scopeOptions: ScopeOption[] = [
    { label: 'Global', value: ApprovalScope.GLOBAL },
    { label: 'Organization', value: ApprovalScope.ORG },
    { label: 'Department', value: ApprovalScope.DEPARTMENT },
  ];

  // Expose enum values for template
  protected readonly WorkflowNodeType = WorkflowNodeType;

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

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
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

  private extractNodesAndEdges(): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  } {
    const nodes: WorkflowNode[] = this.vflowNodes().map((n) => {
      // ngx-vflow uses WritableSignal for point and data - read via function call
      const pointSignal = n.point;
      const point = typeof pointSignal === 'function' ? pointSignal() : pointSignal;
      const dataSignal = (n as VflowNode<VflowNodeData> & { data?: any }).data;
      const data: VflowNodeData | undefined = typeof dataSignal === 'function' ? dataSignal() : dataSignal;
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
