import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DrawerModule } from 'primeng/drawer';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

// Core services
import {
  WorkflowTemplateService,
  WorkflowTemplate,
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

@Component({
  selector: 'approval-workflow-template-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DrawerModule,
    Select,
    DividerModule,
    TooltipModule,
    TagModule,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowTemplateForm implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly templateService = inject(WorkflowTemplateService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  protected readonly template = signal<WorkflowTemplate | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly isViewMode = signal(false);
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);

  protected readonly scopeOptions: ScopeOption[] = [
    { label: 'Global', value: ApprovalScope.GLOBAL },
    { label: 'Organization', value: ApprovalScope.ORG },
    { label: 'Department', value: ApprovalScope.DEPARTMENT },
  ];

  protected form!: FormGroup;

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

    this.route.data.subscribe((data) => {
      const wfTemplate = data['workflowTemplate'] as WorkflowTemplate;
      if (wfTemplate) {
        this.template.set(wfTemplate);

        this.form.patchValue({
          name: wfTemplate.name,
          description: wfTemplate.description || '',
          entityType: wfTemplate.entityType,
          scope: wfTemplate.scope,
          orgId: wfTemplate.orgId || '',
          departmentId: wfTemplate.departmentId || '',
        });

        if (this.isViewMode()) {
          this.form.disable();
        }
      }
    });
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

    const existingTemplate = this.template();

    if (existingTemplate) {
      // Update existing template
      const dto: UpdateWorkflowTemplateDto = {
        name: formValue.name,
        description: formValue.description || undefined,
        entityType: formValue.entityType,
        scope: formValue.scope,
        orgId: formValue.orgId || undefined,
        departmentId: formValue.departmentId || undefined,
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
      // Create new template with default nodes
      const dto: CreateWorkflowTemplateDto = {
        name: formValue.name,
        description: formValue.description || undefined,
        entityType: formValue.entityType,
        scope: formValue.scope,
        orgId: formValue.orgId || undefined,
        departmentId: formValue.departmentId || undefined,
        nodes: [
          {
            id: 'start-1',
            point: { x: 0, y: 200 },
            type: WorkflowNodeType.START,
            data: { label: 'Start' },
          },
          {
            id: 'approval-1',
            point: { x: 300, y: 200 },
            type: WorkflowNodeType.APPROVAL,
            data: {
              label: 'Approval Step',
              approverIds: [],
              approvalMode: ApprovalMode.ANY,
            },
          },
          {
            id: 'end-1',
            point: { x: 600, y: 200 },
            type: WorkflowNodeType.END,
            data: { label: 'End' },
          },
        ],
        edges: [
          { id: 'e1', source: 'start-1', target: 'approval-1' },
          { id: 'e2', source: 'approval-1', target: 'end-1' },
        ],
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

  protected async onClose(): Promise<void> {
    let navigationPromise: Promise<boolean>;
    if (this.template()) {
      navigationPromise = this.router.navigate(['../..'], { relativeTo: this.route });
    } else {
      navigationPromise = this.router.navigate(['..'], { relativeTo: this.route });
    }
    try {
      await navigationPromise;
    } finally {
      this.isVisible.set(false);
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
}
