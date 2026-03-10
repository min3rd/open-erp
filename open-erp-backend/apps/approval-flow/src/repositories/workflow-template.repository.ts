import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApprovalWorkflowTemplate,
  ApprovalWorkflowTemplateDocument,
  ApprovalScope,
  TemplateStatus,
} from '@shared/schemas';

@Injectable()
export class WorkflowTemplateRepository {
  constructor(
    @InjectModel(ApprovalWorkflowTemplate.name)
    private readonly model: Model<ApprovalWorkflowTemplateDocument>,
  ) {}

  async create(
    data: Partial<ApprovalWorkflowTemplate>,
  ): Promise<ApprovalWorkflowTemplateDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<ApprovalWorkflowTemplateDocument | null> {
    return this.model.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });
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
    sortField = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: ApprovalWorkflowTemplateDocument[]; total: number }> {
    const query: any = { deletedAt: null };

    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.scope) query.scope = filters.scope;
    if (filters.status) query.status = filters.status;
    if (filters.orgId) query.orgId = new Types.ObjectId(filters.orgId);
    if (filters.departmentId)
      query.departmentId = new Types.ObjectId(filters.departmentId);
    if (filters.q) {
      query.$or = [
        { name: { $regex: filters.q, $options: 'i' } },
        { description: { $regex: filters.q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async update(
    id: string,
    data: Partial<ApprovalWorkflowTemplate>,
  ): Promise<ApprovalWorkflowTemplateDocument | null> {
    return this.model.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: null },
      { $set: data },
      { new: true },
    );
  }

  async softDelete(
    id: string,
  ): Promise<ApprovalWorkflowTemplateDocument | null> {
    return this.model.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
  }

  async resolveTemplate(
    entityType: string,
    orgId?: string,
    departmentId?: string,
  ): Promise<ApprovalWorkflowTemplateDocument | null> {
    // Priority: DEPARTMENT > ORG > GLOBAL
    if (departmentId) {
      const departmentTemplate = await this.model.findOne({
        entityType,
        scope: ApprovalScope.DEPARTMENT,
        departmentId: new Types.ObjectId(departmentId),
        status: TemplateStatus.PUBLISHED,
        deletedAt: null,
      });
      if (departmentTemplate) return departmentTemplate;
    }

    if (orgId) {
      const orgTemplate = await this.model.findOne({
        entityType,
        scope: ApprovalScope.ORG,
        orgId: new Types.ObjectId(orgId),
        status: TemplateStatus.PUBLISHED,
        deletedAt: null,
      });
      if (orgTemplate) return orgTemplate;
    }

    return this.model.findOne({
      entityType,
      scope: ApprovalScope.GLOBAL,
      status: TemplateStatus.PUBLISHED,
      deletedAt: null,
    });
  }
}
