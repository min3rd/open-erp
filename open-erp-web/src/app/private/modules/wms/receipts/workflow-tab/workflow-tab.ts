import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil } from 'rxjs';

import {
  WmsService,
  Receipt,
  ReceiptWorkflow,
} from '../../../../../../core/services/wms/wms.service';
import {
  DEFAULT_WORKFLOW_STEPS,
  getWorkflowStepSeverity,
  getWorkflowStepIcon,
  getWorkflowStepColor,
  getQcStatusSeverity,
} from '../../../../../../core/constants/receipt-workflow.constants';

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
          status: idx === 0 ? 'completed' : ('pending' as any),
          attachments: [],
        })),
      });
    }
  }

  /** Whether the form is in read-only view mode */
  @Input() isView = false;

  /** Whether this is a new (unsaved) receipt */
  @Input() isNew = false;

  /** Emitted when a workflow transition updates the receipt */
  @Output() receiptUpdated = new EventEmitter<Receipt>();

  protected readonly _receipt = signal<Receipt | null>(null);
  protected readonly workflow = signal<ReceiptWorkflow | null>(null);
  protected readonly workflowLoading = signal(false);
  protected readonly workflowComment = signal('');
  protected readonly workflowTransitioning = signal(false);

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
}
