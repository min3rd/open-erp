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
  RequestNodeState,
  AuditLogEntry,
  ApprovalRequestDocument,
} from '@shared/schemas/approval-request.schema';
import {
  ApprovalMode,
  WorkflowNodeType,
  WorkflowNode,
} from '@shared/schemas/approval-workflow-template.schema';
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

    // Build node states from approval nodes in the template
    const approvalNodes = template.nodes.filter(
      (n) => n.type === WorkflowNodeType.APPROVAL,
    );

    const nodeStates: RequestNodeState[] = approvalNodes.map((node) => ({
      nodeId: node.id,
      label: node.data?.label ?? node.id,
      approverIds: node.data?.approverIds ?? [],
      approvalMode: node.data?.approvalMode ?? ApprovalMode.ANY,
      quorumCount: node.data?.quorumCount,
      status: ApprovalRequestStatus.PENDING,
      approvals: [],
    }));

    // Find the start node and determine the first approval node
    const startNode = template.nodes.find(
      (n) => n.type === WorkflowNodeType.START,
    );
    if (!startNode) {
      throw new BadRequestException('Template has no start node');
    }

    const firstNodeId = this.resolveNextNode(
      startNode.id,
      template.nodes,
      template.edges,
      dto.metadata,
    );

    if (!firstNodeId) {
      throw new BadRequestException(
        'No reachable approval node from start node',
      );
    }

    // Activate the first approval node
    const firstState = nodeStates.find((ns) => ns.nodeId === firstNodeId);
    if (firstState) {
      firstState.status = ApprovalRequestStatus.IN_PROGRESS;
      firstState.startedAt = new Date();
    }

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

    return this.requestRepo.create({
      entityType: dto.entityType,
      entityId: new Types.ObjectId(dto.entityId),
      templateId: template._id as Types.ObjectId,
      orgId: dto.orgId ? new Types.ObjectId(dto.orgId) : undefined,
      departmentId: dto.departmentId
        ? new Types.ObjectId(dto.departmentId)
        : undefined,
      status: ApprovalRequestStatus.IN_PROGRESS,
      currentNodeId: firstNodeId,
      nodeStates,
      edges: template.edges,
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

    const currentState = request.nodeStates.find(
      (ns) => ns.nodeId === request.currentNodeId,
    );
    if (!currentState) {
      throw new BadRequestException('Current node state not found');
    }

    // Verify user is an approver for the current node
    const isApprover = currentState.approverIds.some(
      (id) => id.toString() === userId,
    );
    if (!isApprover) {
      throw new ForbiddenException(
        'You are not an approver for the current node',
      );
    }

    // Check if user already acted on this node
    const alreadyActed = currentState.approvals.some(
      (a) => a.userId.toString() === userId,
    );
    if (alreadyActed) {
      throw new BadRequestException(
        'You have already submitted an action for this node',
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
    currentState.approvals.push({
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
      nodeId: currentState.nodeId,
      comment: dto.comment,
      timestamp: new Date(),
    });

    // Evaluate node completion
    const nodeResult = this.evaluateNodeCompletion(currentState);

    if (nodeResult === 'rejected') {
      currentState.status = ApprovalRequestStatus.REJECTED;
      currentState.completedAt = new Date();
      request.status = ApprovalRequestStatus.REJECTED;
      request.completedAt = new Date();
    } else if (nodeResult === 'changes_requested') {
      currentState.status = ApprovalRequestStatus.CHANGES_REQUESTED;
      request.status = ApprovalRequestStatus.CHANGES_REQUESTED;
    } else if (nodeResult === 'approved') {
      currentState.status = ApprovalRequestStatus.APPROVED;
      currentState.completedAt = new Date();

      // Traverse graph to find next node
      const nextNodeId = this.resolveNextNode(
        currentState.nodeId,
        // Build a minimal nodes array from nodeStates + end placeholders
        request.nodeStates.map((ns) => ({
          id: ns.nodeId,
          type: WorkflowNodeType.APPROVAL,
          point: { x: 0, y: 0 },
        })),
        request.edges,
        request.metadata,
      );

      if (!nextNodeId) {
        // No more approval nodes — check if we reached end
        request.status = ApprovalRequestStatus.APPROVED;
        request.completedAt = new Date();
      } else {
        const nextState = request.nodeStates.find(
          (ns) => ns.nodeId === nextNodeId,
        );
        if (nextState) {
          request.currentNodeId = nextNodeId;
          nextState.status = ApprovalRequestStatus.IN_PROGRESS;
          nextState.startedAt = new Date();
        } else {
          // Target is an end node — request is complete
          request.status = ApprovalRequestStatus.APPROVED;
          request.completedAt = new Date();
        }
      }
    }

    const updated = await this.requestRepo.update(requestId, {
      status: request.status,
      currentNodeId: request.currentNodeId,
      nodeStates: request.nodeStates,
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
   * Evaluate if an approval node is completed based on its approval mode
   */
  evaluateNodeCompletion(
    nodeState: RequestNodeState,
  ): 'pending' | 'approved' | 'rejected' | 'changes_requested' {
    const { approvals, approverIds, approvalMode, quorumCount } = nodeState;

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
   * Traverse the graph from a source node to find the next approval node.
   * Handles condition nodes by evaluating edge conditions against metadata.
   * Returns null if the next node is an 'end' node or no outgoing edges.
   */
  resolveNextNode(
    sourceNodeId: string,
    nodes: Array<{ id: string; type: WorkflowNodeType; point: { x: number; y: number } }>,
    edges: Array<{
      id: string;
      source: string;
      target: string;
      data?: { label?: string; conditions?: Array<{ field: string; operator: string; value: any }> };
    }>,
    metadata?: Record<string, any>,
    visited: Set<string> = new Set(),
  ): string | null {
    if (visited.has(sourceNodeId)) return null;
    visited.add(sourceNodeId);

    // Get outgoing edges from the source node
    const outgoing = edges.filter((e) => e.source === sourceNodeId);
    if (outgoing.length === 0) return null;

    for (const edge of outgoing) {
      // If edge has conditions, evaluate them
      if (edge.data?.conditions && edge.data.conditions.length > 0) {
        if (!metadata || !this.evaluateEdgeConditions(edge.data.conditions, metadata)) {
          continue; // Conditions not met, skip this edge
        }
      }

      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!targetNode) {
        // Target could be an end node not in nodeStates; check edge target
        // If no node found, this is an end node reference
        return null;
      }

      if (targetNode.type === WorkflowNodeType.END) {
        return null; // Reached end
      }

      if (targetNode.type === WorkflowNodeType.APPROVAL) {
        return targetNode.id; // Found next approval node
      }

      if (targetNode.type === WorkflowNodeType.CONDITION) {
        // Recursively traverse through condition node
        const result = this.resolveNextNode(
          targetNode.id,
          nodes,
          edges,
          metadata,
          visited,
        );
        if (result !== null) return result;
      }

      if (targetNode.type === WorkflowNodeType.START) {
        // Should not loop back to start, skip
        continue;
      }
    }

    return null;
  }

  /**
   * Evaluate edge conditions against metadata values
   */
  private evaluateEdgeConditions(
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
   * Handle SHARE action — log sharing without counting as approval
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
      nodeId: request.currentNodeId,
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
