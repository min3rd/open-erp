import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { Subject, takeUntil } from 'rxjs';

import {
  WmsService,
  Receipt,
  ReceiptWorkflow,
  WorkflowStep,
  WorkflowStepStatus,
} from '../../../../../../core/services/wms/wms.service';
import {
  DEFAULT_WORKFLOW_STEPS,
  getWorkflowStepSeverity,
  getWorkflowStepIcon,
  getWorkflowStepColor,
  getQcStatusSeverity,
} from '../../../../../../core/constants/receipt-workflow.constants';

/** Editable step entry used in configuration mode */
interface EditableStep {
  key: string;
  label: string;
  assigneeType: 'role' | 'user';
  assigneeValue: string;
}

@Component({
  selector: 'receipt-workflow-tab',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    TagModule,
    TextareaModule,
    InputTextModule,
    TooltipModule,
    SelectModule,
  ],
  templateUrl: './workflow-tab.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptWorkflowTab implements OnDestroy {
  private readonly wmsService = inject(WmsService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  /** Current receipt (null for unsaved new receipts) */
  @Input() set receipt(value: Receipt | null) {
    this._receipt.set(value);
    if (value?.id) {
      this.loadWorkflow();
    } else {
      // Show default steps for new unsaved receipts
      this.workflow.set({
        currentStep: 'created',
        steps: DEFAULT_WORKFLOW_STEPS.map((s, idx) => ({
          key: s.key,
          label: s.label,
          status: idx === 0 ? WorkflowStepStatus.COMPLETED : WorkflowStepStatus.PENDING,
          attachments: [],
        })),
      });
    }
    this.initEditableSteps();
  }

  /** Whether the form is in read-only view mode */
  @Input() isView = false;

  /** Whether this is a new (unsaved) receipt */
  @Input() isNew = false;

  /** Emitted when a workflow transition updates the receipt */
  @Output() receiptUpdated = new EventEmitter<Receipt>();

  /** Emitted when step configuration changes (for parent to persist) */
  @Output() stepsChanged = new EventEmitter<EditableStep[]>();

  protected readonly _receipt = signal<Receipt | null>(null);
  protected readonly workflow = signal<ReceiptWorkflow | null>(null);
  protected readonly workflowLoading = signal(false);
  protected readonly workflowComment = signal('');
  protected readonly workflowTransitioning = signal(false);

  // Step configuration state
  protected readonly configMode = signal(false);
  protected readonly editableSteps = signal<EditableStep[]>([]);

  /** Whether editing steps is allowed (only for draft/new receipts) */
  protected readonly canEditSteps = computed(() => {
    const receipt = this._receipt();
    return this.isNew || !receipt || receipt.status === 'draft';
  });

  protected readonly assigneeTypeOptions = [
    { label: 'Role', value: 'role' },
    { label: 'User', value: 'user' },
  ];

  // Expose shared helpers to template
  protected readonly getStepSeverity = getWorkflowStepSeverity;
  protected readonly getStepIcon = getWorkflowStepIcon;
  protected readonly getStepColor = getWorkflowStepColor;
  protected readonly getQcSeverity = getQcStatusSeverity;

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected loadWorkflow() {
    const receiptId = this._receipt()?.id;
    if (!receiptId) return;

    this.workflowLoading.set(true);
    this.wmsService
      .getReceiptWorkflow(receiptId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (wf) => {
          this.workflow.set(wf);
          this.workflowLoading.set(false);
        },
        error: () => this.workflowLoading.set(false),
      });
  }

  protected transitionWorkflow(action: string) {
    const receiptId = this._receipt()?.id;
    if (!receiptId) return;

    this.workflowTransitioning.set(true);
    this.wmsService
      .transitionWorkflow(receiptId, {
        action,
        comment: this.workflowComment() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this._receipt.set(updated);
          this.workflowComment.set('');
          this.workflowTransitioning.set(false);
          this.receiptUpdated.emit(updated);
          this.loadWorkflow();
        },
        error: () => this.workflowTransitioning.set(false),
      });
  }

  protected getAvailableActions(): {
    action: string;
    label: string;
    severity: string;
    icon: string;
  }[] {
    const wf = this.workflow();
    if (!wf || this.isNew) return [];

    const currentStep = wf.currentStep;
    const actions: {
      action: string;
      label: string;
      severity: string;
      icon: string;
    }[] = [];

    switch (currentStep) {
      case 'created':
        break;
      case 'pending_approval':
        actions.push(
          {
            action: 'approve',
            label: this.translocoService.translate('wms.receipts.workflow.actionApprove'),
            severity: 'success',
            icon: 'pi pi-check',
          },
          {
            action: 'reject',
            label: this.translocoService.translate('wms.receipts.workflow.actionReject'),
            severity: 'danger',
            icon: 'pi pi-times',
          },
        );
        break;
      case 'approved':
        actions.push({
          action: 'receive',
          label: this.translocoService.translate('wms.receipts.workflow.actionReceive'),
          severity: 'info',
          icon: 'pi pi-box',
        });
        break;
      case 'receiving':
        actions.push({
          action: 'qc_perform',
          label: this.translocoService.translate('wms.receipts.workflow.actionQcPerform'),
          severity: 'warn',
          icon: 'pi pi-search',
        });
        break;
      case 'qc_check':
        actions.push({
          action: 'qc_approve',
          label: this.translocoService.translate('wms.receipts.workflow.actionQcApprove'),
          severity: 'success',
          icon: 'pi pi-verified',
        });
        break;
      case 'qc_approved':
        actions.push({
          action: 'store',
          label: this.translocoService.translate('wms.receipts.workflow.actionStore'),
          severity: 'info',
          icon: 'pi pi-warehouse',
        });
        break;
      case 'putaway':
        actions.push({
          action: 'complete',
          label: this.translocoService.translate('wms.receipts.workflow.actionComplete'),
          severity: 'success',
          icon: 'pi pi-check-circle',
        });
        break;
    }

    return actions;
  }

  // ── Step configuration ──────────────────────────────────────────────

  /** Initialize editable steps from current workflow or defaults */
  private initEditableSteps() {
    const wf = this.workflow();
    const steps = wf?.steps ?? DEFAULT_WORKFLOW_STEPS;
    this.editableSteps.set(
      steps.map((s) => ({
        key: s.key,
        label: s.label,
        assigneeType: 'role' as const,
        assigneeValue: '',
      })),
    );
  }

  /** Toggle step configuration mode */
  protected toggleConfigMode() {
    if (!this.configMode()) {
      this.initEditableSteps();
    }
    this.configMode.update((v) => !v);
  }

  /** Add a new step at the given position (before the last "completed" step) */
  protected addStep(index: number) {
    const steps = [...this.editableSteps()];
    const newKey = `custom_${Date.now()}`;
    steps.splice(index, 0, {
      key: newKey,
      label: '',
      assigneeType: 'role',
      assigneeValue: '',
    });
    this.editableSteps.set(steps);
  }

  /** Remove a step by index (protected steps: created, completed cannot be removed) */
  protected removeStep(index: number) {
    const steps = [...this.editableSteps()];
    const step = steps[index];
    if (step.key === 'created' || step.key === 'completed') return;
    steps.splice(index, 1);
    this.editableSteps.set(steps);
  }

  /** Update a step's label */
  protected updateStepLabel(index: number, label: string) {
    const steps = [...this.editableSteps()];
    steps[index] = { ...steps[index], label };
    this.editableSteps.set(steps);
  }

  /** Update a step's assignee type */
  protected updateStepAssigneeType(index: number, assigneeType: 'role' | 'user') {
    const steps = [...this.editableSteps()];
    steps[index] = { ...steps[index], assigneeType, assigneeValue: '' };
    this.editableSteps.set(steps);
  }

  /** Update a step's assignee value */
  protected updateStepAssigneeValue(index: number, assigneeValue: string) {
    const steps = [...this.editableSteps()];
    steps[index] = { ...steps[index], assigneeValue };
    this.editableSteps.set(steps);
  }

  /** Save step configuration and exit config mode */
  protected saveStepConfig() {
    const steps = this.editableSteps();
    this.stepsChanged.emit(steps);

    // Update the local workflow display
    const wf = this.workflow();
    if (wf) {
      this.workflow.set({
        ...wf,
        steps: steps.map((s) => ({
          key: s.key,
          label: s.label || s.key,
          status: wf.steps.find((ws) => ws.key === s.key)?.status ?? WorkflowStepStatus.PENDING,
          attachments: [],
        })),
      });
    }
    this.configMode.set(false);
  }

  /** Check if a step is protected from deletion */
  protected isProtectedStep(key: string): boolean {
    return key === 'created' || key === 'completed';
  }
}
