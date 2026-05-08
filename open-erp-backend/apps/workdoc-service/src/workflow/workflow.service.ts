import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WorkflowRequest,
  WorkflowRequestDocument,
} from './schemas/workflow-request.schema';
import { CreateWorkflowDto } from './dto/create-workflow.dto';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectModel(WorkflowRequest.name)
    private readonly workflowModel: Model<WorkflowRequestDocument>,
  ) {}

  async create(
    tenantId: string,
    dto: CreateWorkflowDto,
    requestedBy: string,
  ): Promise<WorkflowRequestDocument> {
    this.logger.log(
      `[WorkDoc] Tenant ${tenantId} — createWorkflow entityType=${dto.entityType} entityId=${dto.entityId}`,
    );
    const req = new this.workflowModel({ ...dto, tenantId, requestedBy });
    return req.save();
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: WorkflowRequestDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.workflowModel
        .find({ tenantId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.workflowModel.countDocuments({ tenantId }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<WorkflowRequestDocument> {
    const req = await this.workflowModel
      .findOne({ _id: id, tenantId })
      .exec();
    if (!req) {
      throw new NotFoundException(`WorkflowRequest ${id} not found`);
    }
    return req;
  }

  async approve(
    tenantId: string,
    id: string,
    approvedBy: string,
    comment?: string,
  ): Promise<WorkflowRequestDocument> {
    const req = await this.findOne(tenantId, id);
    if (req.status !== 'pending') {
      throw new BadRequestException(
        `Cannot approve workflow in status "${req.status}"`,
      );
    }
    req.status = 'approved';
    req.approvedBy = approvedBy;
    req.approvedAt = new Date();
    this.logger.log(
      `[WorkDoc] Tenant ${tenantId} — approveWorkflow id=${id} by=${approvedBy}`,
    );
    return req.save();
  }

  async reject(
    tenantId: string,
    id: string,
    rejectedBy: string,
    reason?: string,
  ): Promise<WorkflowRequestDocument> {
    const req = await this.findOne(tenantId, id);
    if (req.status !== 'pending') {
      throw new BadRequestException(
        `Cannot reject workflow in status "${req.status}"`,
      );
    }
    req.status = 'rejected';
    req.approvedBy = rejectedBy;
    req.rejectionReason = reason;
    this.logger.log(
      `[WorkDoc] Tenant ${tenantId} — rejectWorkflow id=${id} by=${rejectedBy}`,
    );
    return req.save();
  }
}
