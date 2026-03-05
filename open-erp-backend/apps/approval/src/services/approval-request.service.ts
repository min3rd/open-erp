import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApprovalRequestRepository } from '../repositories/approval-request.repository';
import { WorkflowTemplateService } from './workflow-template.service';
import {
  ApprovalRequestStatus,
  ApprovalActionType,
  RequestStep,
  AuditLogEntry,
  ApprovalRequestDocument,
} from '@shared/schemas/approval-request.schema';
import { ApprovalMode } from '@shared/schemas/approval-workflow-template.schema';
import {
  CreateApprovalRequestDto,
  SubmitApprovalActionDto,
} from '../dto/approval-request.dto';
import { MinioService } from '@shared/services/minio/minio.service';

@Injectable()
export class ApprovalRequestService {
  private readonly logger = new Logger(ApprovalRequestService.name);

  constructor(
    private readonly requestRepo: ApprovalRequestRepository,
    private readonly templateService: WorkflowTemplateService,
    @Inject(MinioService) private readonly minioService: MinioService,
  ) {}

  async create(
    dto: CreateApprovalRequestDto,
    userId: string,
  ): Promise<ApprovalRequestDocument> {
    // Check for existing active request for same entity
    const existing = await this.requestRepo.findByEntityTypeAndId(
      dto.entityType,
      dto.entityId,
    );
    if (existing) {
      throw new BadRequestException(
        'An active approval request already exists for this entity',
      );
    }

    // Resolve the workflow template by scope priority
    const template = await this.templateService.resolveTemplate(
      dto.entityType,
      dto.orgId,
      dto.departmentId,
    );

    // Build request steps from template
    const steps: RequestStep[] = template.steps.map((step) => ({
      order: step.order,
      name: step.name,
      approverIds: step.approverIds,
      approvalMode: step.approvalMode,
      quorumCount: step.quorumCount,
      branches: step.branches,
      status: ApprovalRequestStatus.PENDING,
      approvals: [],
    }));

    const auditLog: AuditLogEntry[] = [
      {
        action: 'REQUEST_CREATED',
        userId: new Types.ObjectId(userId),
        timestamp: new Date(),
        details: {
          templateId: template._id.toString(),
          templateName: template.name,
          scope: template.scope,
        },
      },
    ];

    // Set the first step to IN_PROGRESS
    if (steps.length > 0) {
      steps[0].status = ApprovalRequestStatus.IN_PROGRESS;
      steps[0].startedAt = new Date();
    }

    return this.requestRepo.create({
      entityType: dto.entityType,
      entityId: new Types.ObjectId(dto.entityId),
      templateId: template._id as Types.ObjectId,
      orgId: dto.orgId ? new Types.ObjectId(dto.orgId) : undefined,
      departmentId: dto.departmentId
        ? new Types.ObjectId(dto.departmentId)
        : undefined,
      status: ApprovalRequestStatus.IN_PROGRESS,
      currentStepOrder: 0,
      steps,
      auditLog,
      metadata: dto.metadata,
      requestedBy: new Types.ObjectId(userId),
    });
  }

  async findById(id: string): Promise<ApprovalRequestDocument> {
    const request = await this.requestRepo.findById(id);
    if (!request) {
      throw new NotFoundException('Approval request not found');
    }
    return request;
  }

  async findAll(
    filters: {
      entityType?: string;
      entityId?: string;
      orgId?: string;
      status?: ApprovalRequestStatus;
      requestedBy?: string;
      approverId?: string;
      q?: string;
    },
    page: number,
    limit: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
  ) {
    return this.requestRepo.findAll(filters, page, limit, sortField, sortOrder);
  }

  async submitAction(
    requestId: string,
    dto: SubmitApprovalActionDto,
    userId: string,
  ): Promise<ApprovalRequestDocument> {
    const request = await this.findById(requestId);

    if (
      request.status !== ApprovalRequestStatus.IN_PROGRESS &&
      request.status !== ApprovalRequestStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException(
        `Cannot perform action on request with status "${request.status}"`,
      );
    }

    // Handle SHARE action separately
    if (dto.action === ApprovalActionType.SHARE) {
      return this.handleShareAction(request, dto, userId);
    }

    const currentStep = request.steps.find(
      (s) => s.order === request.currentStepOrder,
    );
    if (!currentStep) {
      throw new BadRequestException('Current step not found');
    }

    // Verify user is an approver for the current step
    const isApprover = currentStep.approverIds.some(
      (id) => id.toString() === userId,
    );
    if (!isApprover) {
      throw new ForbiddenException(
        'You are not an approver for the current step',
      );
    }

    // Check if user already acted on this step
    const alreadyActed = currentStep.approvals.some(
      (a) => a.userId.toString() === userId,
    );
    if (alreadyActed) {
      throw new BadRequestException(
        'You have already submitted an action for this step',
      );
    }

    // Generate public URLs for attachments
    const attachments = dto.attachments
      ? await Promise.all(
          dto.attachments.map(async (att) => {
            let publicUrl: string | undefined;
            try {
              publicUrl = await this.minioService.getPresignedUrl(
                att.fileKey,
                { bucket: att.fileBucket },
              );
            } catch {
              this.logger.warn(
                `Failed to generate presigned URL for ${att.fileKey}`,
              );
            }
            return {
              ...att,
              uploadedBy: new Types.ObjectId(userId),
              uploadedAt: new Date(),
              publicUrl,
            };
          }),
        )
      : undefined;

    // Record the approval action
    currentStep.approvals.push({
      userId: new Types.ObjectId(userId),
      action: dto.action,
      comment: dto.comment,
      attachments,
      actionAt: new Date(),
    });

    // Add audit log
    request.auditLog.push({
      action: dto.action,
      userId: new Types.ObjectId(userId),
      stepOrder: currentStep.order,
      comment: dto.comment,
      timestamp: new Date(),
    });

    // Evaluate step completion
    const stepResult = this.evaluateStepCompletion(currentStep);

    if (stepResult === 'rejected') {
      currentStep.status = ApprovalRequestStatus.REJECTED;
      currentStep.completedAt = new Date();
      request.status = ApprovalRequestStatus.REJECTED;
      request.completedAt = new Date();
    } else if (stepResult === 'changes_requested') {
      currentStep.status = ApprovalRequestStatus.CHANGES_REQUESTED;
      request.status = ApprovalRequestStatus.CHANGES_REQUESTED;
    } else if (stepResult === 'approved') {
      currentStep.status = ApprovalRequestStatus.APPROVED;
      currentStep.completedAt = new Date();

      // Determine next step (handle branching)
      const nextStepOrder = this.resolveNextStep(
        request,
        currentStep,
      );

      if (nextStepOrder === null) {
        // No more steps — request fully approved
        request.status = ApprovalRequestStatus.APPROVED;
        request.completedAt = new Date();
      } else {
        // Move to next step
        request.currentStepOrder = nextStepOrder;
        const nextStep = request.steps.find((s) => s.order === nextStepOrder);
        if (nextStep) {
          nextStep.status = ApprovalRequestStatus.IN_PROGRESS;
          nextStep.startedAt = new Date();
        }
      }
    }

    const updated = await this.requestRepo.update(requestId, {
      status: request.status,
      currentStepOrder: request.currentStepOrder,
      steps: request.steps,
      auditLog: request.auditLog,
      completedAt: request.completedAt,
    });

    if (!updated) {
      throw new NotFoundException('Approval request not found');
    }

    return updated;
  }

  async cancel(
    requestId: string,
    userId: string,
  ): Promise<ApprovalRequestDocument> {
    const request = await this.findById(requestId);

    if (request.requestedBy.toString() !== userId) {
      throw new ForbiddenException(
        'Only the requester can cancel the approval request',
      );
    }

    if (
      request.status === ApprovalRequestStatus.APPROVED ||
      request.status === ApprovalRequestStatus.REJECTED ||
      request.status === ApprovalRequestStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel a request with status "${request.status}"`,
      );
    }

    request.auditLog.push({
      action: 'CANCELLED',
      userId: new Types.ObjectId(userId),
      timestamp: new Date(),
    });

    const updated = await this.requestRepo.update(requestId, {
      status: ApprovalRequestStatus.CANCELLED,
      auditLog: request.auditLog,
      completedAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundException('Approval request not found');
    }

    return updated;
  }

  /**
   * Evaluate if a step is completed based on its approval mode
   */
  evaluateStepCompletion(
    step: RequestStep,
  ): 'pending' | 'approved' | 'rejected' | 'changes_requested' {
    const { approvals, approverIds, approvalMode, quorumCount } = step;

    // Any rejection in ANY or ALL mode immediately rejects
    const rejections = approvals.filter(
      (a) => a.action === ApprovalActionType.REJECT,
    );
    const changesRequested = approvals.filter(
      (a) => a.action === ApprovalActionType.REQUEST_CHANGES,
    );
    const approvedActions = approvals.filter(
      (a) => a.action === ApprovalActionType.APPROVE,
    );

    if (rejections.length > 0) {
      return 'rejected';
    }

    if (changesRequested.length > 0) {
      return 'changes_requested';
    }

    switch (approvalMode) {
      case ApprovalMode.ANY:
        return approvedActions.length >= 1 ? 'approved' : 'pending';

      case ApprovalMode.ALL:
        return approvedActions.length >= approverIds.length
          ? 'approved'
          : 'pending';

      case ApprovalMode.QUORUM: {
        const needed = quorumCount ?? Math.ceil(approverIds.length / 2);
        return approvedActions.length >= needed ? 'approved' : 'pending';
      }

      default:
        return 'pending';
    }
  }

  /**
   * Resolve the next step order based on branching conditions.
   * Branches are evaluated against the request metadata.
   * If a branch's conditions all match, the request jumps to that branch's nextStepOrder.
   * Otherwise, it proceeds to the next sequential step.
   */
  private resolveNextStep(
    request: ApprovalRequestDocument,
    currentStep: RequestStep,
  ): number | null {
    // Evaluate branches if defined on the current step
    if (currentStep.branches && currentStep.branches.length > 0 && request.metadata) {
      for (const branch of currentStep.branches) {
        if (this.evaluateBranchConditions(branch.conditions, request.metadata)) {
          // Verify the target step exists
          const targetStep = request.steps.find(
            (s) => s.order === branch.nextStepOrder,
          );
          if (targetStep) {
            return branch.nextStepOrder;
          }
        }
      }
    }

    // Default: go to next sequential step
    const sortedSteps = [...request.steps].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSteps.findIndex(
      (s) => s.order === currentStep.order,
    );

    if (currentIndex < sortedSteps.length - 1) {
      return sortedSteps[currentIndex + 1].order;
    }

    return null; // No more steps
  }

  /**
   * Evaluate branch conditions against metadata values
   */
  private evaluateBranchConditions(
    conditions: Array<{ field: string; operator: string; value: any }>,
    metadata: Record<string, any>,
  ): boolean {
    return conditions.every((cond) => {
      const fieldValue = metadata[cond.field];
      switch (cond.operator) {
        case 'eq':
          return fieldValue === cond.value;
        case 'ne':
          return fieldValue !== cond.value;
        case 'gt':
          return fieldValue > cond.value;
        case 'gte':
          return fieldValue >= cond.value;
        case 'lt':
          return fieldValue < cond.value;
        case 'lte':
          return fieldValue <= cond.value;
        case 'in':
          return Array.isArray(cond.value) && cond.value.includes(fieldValue);
        case 'nin':
          return Array.isArray(cond.value) && !cond.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  /**
   * Handle SHARE action — add user to step approvers without counting as approval
   */
  private async handleShareAction(
    request: ApprovalRequestDocument,
    dto: SubmitApprovalActionDto,
    userId: string,
  ): Promise<ApprovalRequestDocument> {
    if (!dto.shareWithUserIds || dto.shareWithUserIds.length === 0) {
      throw new BadRequestException(
        'shareWithUserIds is required for SHARE action',
      );
    }

    request.auditLog.push({
      action: 'SHARE',
      userId: new Types.ObjectId(userId),
      stepOrder: request.currentStepOrder,
      comment: dto.comment,
      timestamp: new Date(),
      details: { sharedWith: dto.shareWithUserIds },
    });

    const updated = await this.requestRepo.update(request._id.toString(), {
      auditLog: request.auditLog,
    });

    if (!updated) {
      throw new NotFoundException('Approval request not found');
    }

    return updated;
  }
}
