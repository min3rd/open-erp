import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { WorkflowTemplateRepository } from '../repositories/workflow-template.repository';
import {
  ApprovalScope,
  TemplateStatus,
  WorkflowNodeType,
  ApprovalWorkflowTemplateDocument,
} from '@shared/schemas';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  CloneWorkflowTemplateDto,
} from '../dto/workflow-template.dto';

@Injectable()
export class WorkflowTemplateService {
  constructor(private readonly templateRepo: WorkflowTemplateRepository) {}

  async create(
    dto: CreateWorkflowTemplateDto,
    userId: string,
  ): Promise<ApprovalWorkflowTemplateDocument> {
    this.validateScopeFields(dto.scope, dto.orgId, dto.departmentId);

    const nodes = dto.nodes.map((node) => ({
      ...node,
      data: node.data
        ? {
            ...node.data,
            approverIds: node.data.approverIds?.map(
              (id) => new Types.ObjectId(id),
            ),
          }
        : undefined,
    }));

    return this.templateRepo.create({
      name: dto.name,
      description: dto.description,
      entityType: dto.entityType,
      scope: dto.scope,
      orgId: dto.orgId ? new Types.ObjectId(dto.orgId) : undefined,
      departmentId: dto.departmentId
        ? new Types.ObjectId(dto.departmentId)
        : undefined,
      status: TemplateStatus.DRAFT,
      version: 1,
      nodes,
      edges: dto.edges,
      createdBy: new Types.ObjectId(userId),
    });
  }

  async findById(id: string): Promise<ApprovalWorkflowTemplateDocument> {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw new NotFoundException('Workflow template not found');
    }
    return template;
  }

  async findAll(
    filters: {
      entityType?: string;
      scope?: ApprovalScope;
      orgId?: string;
      departmentId?: string;
      status?: TemplateStatus;
      q?: string;
    },
    page: number,
    limit: number,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
  ) {
    return this.templateRepo.findAll(
      filters,
      page,
      limit,
      sortField,
      sortOrder,
    );
  }

  async update(
    id: string,
    dto: UpdateWorkflowTemplateDto,
  ): Promise<ApprovalWorkflowTemplateDocument> {
    const template = await this.findById(id);

    if (template.status === TemplateStatus.PUBLISHED) {
      throw new ConflictException(
        'Cannot edit a published template. Create a new version instead.',
      );
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.scope !== undefined) {
      this.validateScopeFields(
        dto.scope,
        dto.orgId ?? template.orgId?.toString(),
        dto.departmentId ?? template.departmentId?.toString(),
      );
      updateData.scope = dto.scope;
    }
    if (dto.orgId !== undefined)
      updateData.orgId = new Types.ObjectId(dto.orgId);
    if (dto.departmentId !== undefined)
      updateData.departmentId = new Types.ObjectId(dto.departmentId);
    if (dto.nodes !== undefined) {
      updateData.nodes = dto.nodes.map((node) => ({
        ...node,
        data: node.data
          ? {
              ...node.data,
              approverIds: node.data.approverIds?.map(
                (id) => new Types.ObjectId(id),
              ),
            }
          : undefined,
      }));
    }
    if (dto.edges !== undefined) {
      updateData.edges = dto.edges;
    }

    const updated = await this.templateRepo.update(id, updateData);
    if (!updated) {
      throw new NotFoundException('Workflow template not found');
    }
    return updated;
  }

  async publish(id: string): Promise<ApprovalWorkflowTemplateDocument> {
    const template = await this.findById(id);

    if (template.status === TemplateStatus.PUBLISHED) {
      throw new ConflictException('Template is already published');
    }

    if (!template.nodes || template.nodes.length === 0) {
      throw new BadRequestException(
        'Template must have at least one node to publish',
      );
    }

    // Validate graph has at least one start and one approval node
    const hasStart = template.nodes.some(
      (n) => n.type === WorkflowNodeType.START,
    );
    const hasApproval = template.nodes.some(
      (n) => n.type === WorkflowNodeType.APPROVAL,
    );
    if (!hasStart || !hasApproval) {
      throw new BadRequestException(
        'Template must have at least one start node and one approval node to publish',
      );
    }

    const updated = await this.templateRepo.update(id, {
      status: TemplateStatus.PUBLISHED,
    });
    if (!updated) {
      throw new NotFoundException('Workflow template not found');
    }
    return updated;
  }

  async archive(id: string): Promise<ApprovalWorkflowTemplateDocument> {
    const template = await this.findById(id);

    if (template.status === TemplateStatus.ARCHIVED) {
      throw new ConflictException('Template is already archived');
    }

    const updated = await this.templateRepo.update(id, {
      status: TemplateStatus.ARCHIVED,
    });
    if (!updated) {
      throw new NotFoundException('Workflow template not found');
    }
    return updated;
  }

  async clone(
    id: string,
    dto: CloneWorkflowTemplateDto,
    userId: string,
  ): Promise<ApprovalWorkflowTemplateDocument> {
    const source = await this.findById(id);

    const scope = dto.scope ?? source.scope;
    const orgId = dto.orgId ?? source.orgId?.toString();
    const departmentId = dto.departmentId ?? source.departmentId?.toString();

    this.validateScopeFields(scope, orgId, departmentId);

    return this.templateRepo.create({
      name: dto.name,
      description: dto.description ?? source.description,
      entityType: source.entityType,
      scope,
      orgId: orgId ? new Types.ObjectId(orgId) : undefined,
      departmentId: departmentId ? new Types.ObjectId(departmentId) : undefined,
      status: TemplateStatus.DRAFT,
      version: 1,
      nodes: source.nodes,
      edges: source.edges,
      createdBy: new Types.ObjectId(userId),
    });
  }

  async changeStatus(
    id: string,
    newStatus: TemplateStatus,
  ): Promise<ApprovalWorkflowTemplateDocument> {
    const template = await this.findById(id);

    if (template.status === newStatus) {
      throw new ConflictException(`Template is already ${newStatus}`);
    }

    if (newStatus === TemplateStatus.PUBLISHED) {
      return this.publish(id);
    }

    const updated = await this.templateRepo.update(id, { status: newStatus });
    if (!updated) {
      throw new NotFoundException('Workflow template not found');
    }
    return updated;
  }

  validateWorkflow(
    nodes: { id: string; type: string; data?: any }[],
    edges: { id: string; source: string; target: string }[],
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!nodes || nodes.length === 0) {
      errors.push('Workflow must have at least one node');
      return { valid: false, errors };
    }

    const startNodes = nodes.filter((n) => n.type === WorkflowNodeType.START);
    const endNodes = nodes.filter((n) => n.type === WorkflowNodeType.END);
    const approvalNodes = nodes.filter(
      (n) => n.type === WorkflowNodeType.APPROVAL,
    );

    if (startNodes.length === 0) {
      errors.push('Workflow must have at least one start node');
    }
    if (startNodes.length > 1) {
      errors.push('Workflow must have exactly one start node');
    }
    if (endNodes.length === 0) {
      errors.push('Workflow must have at least one end node');
    }
    if (approvalNodes.length === 0) {
      errors.push('Workflow must have at least one approval node');
    }

    // Validate node IDs are unique
    const nodeIds = new Set(nodes.map((n) => n.id));
    if (nodeIds.size !== nodes.length) {
      errors.push('Node IDs must be unique');
    }

    // Validate edges reference existing nodes
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(
          `Edge "${edge.id}" references non-existent source node "${edge.source}"`,
        );
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(
          `Edge "${edge.id}" references non-existent target node "${edge.target}"`,
        );
      }
    }

    // Validate approval nodes have approverIds
    for (const node of approvalNodes) {
      if (!node.data?.approverIds || node.data.approverIds.length === 0) {
        errors.push(
          `Approval node "${node.id}" must have at least one approver`,
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.templateRepo.softDelete(id);
    if (!result) {
      throw new NotFoundException('Workflow template not found');
    }
  }

  async resolveTemplate(
    entityType: string,
    orgId?: string,
    departmentId?: string,
  ): Promise<ApprovalWorkflowTemplateDocument> {
    const template = await this.templateRepo.resolveTemplate(
      entityType,
      orgId,
      departmentId,
    );
    if (!template) {
      throw new NotFoundException(
        `No published workflow template found for entity type "${entityType}"`,
      );
    }
    return template;
  }

  private validateScopeFields(
    scope: ApprovalScope,
    orgId?: string,
    departmentId?: string,
  ): void {
    if (scope === ApprovalScope.ORG && !orgId) {
      throw new BadRequestException(
        'Organization ID is required for ORG scope',
      );
    }
    if (scope === ApprovalScope.DEPARTMENT) {
      if (!orgId) {
        throw new BadRequestException(
          'Organization ID is required for DEPARTMENT scope',
        );
      }
      if (!departmentId) {
        throw new BadRequestException(
          'Department ID is required for DEPARTMENT scope',
        );
      }
    }
  }
}
