import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApprovalRequest,
  ApprovalRequestDocument,
  ApprovalRequestStatus,
} from '@shared/schemas';

@Injectable()
export class ApprovalRequestRepository {
  constructor(
    @InjectModel(ApprovalRequest.name)
    private readonly model: Model<ApprovalRequestDocument>,
  ) {}

  async create(
    data: Partial<ApprovalRequest>,
  ): Promise<ApprovalRequestDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<ApprovalRequestDocument | null> {
    return this.model.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });
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
    sortField = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ items: ApprovalRequestDocument[]; total: number }> {
    const query: any = { deletedAt: null };

    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId)
      query.entityId = new Types.ObjectId(filters.entityId);
    if (filters.orgId) query.orgId = new Types.ObjectId(filters.orgId);
    if (filters.status) query.status = filters.status;
    if (filters.requestedBy)
      query.requestedBy = new Types.ObjectId(filters.requestedBy);
    if (filters.approverId) {
      query['steps.approverIds'] = new Types.ObjectId(filters.approverId);
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
    data: Partial<ApprovalRequest>,
  ): Promise<ApprovalRequestDocument | null> {
    return this.model.findOneAndUpdate(
      { _id: new Types.ObjectId(id), deletedAt: null },
      { $set: data },
      { new: true },
    );
  }

  async findByEntityTypeAndId(
    entityType: string,
    entityId: string,
  ): Promise<ApprovalRequestDocument | null> {
    return this.model.findOne({
      entityType,
      entityId: new Types.ObjectId(entityId),
      deletedAt: null,
      status: {
        $nin: [
          ApprovalRequestStatus.CANCELLED,
          ApprovalRequestStatus.APPROVED,
          ApprovalRequestStatus.REJECTED,
        ],
      },
    });
  }
}
