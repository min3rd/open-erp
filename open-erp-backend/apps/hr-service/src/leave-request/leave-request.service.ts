import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaveRequest, LeaveRequestDocument } from './schemas/leave-request.schema';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ApproveLeaveRequestDto } from './dto/approve-leave-request.dto';

@Injectable()
export class LeaveRequestService {
  private readonly logger = new Logger(LeaveRequestService.name);

  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,
  ) {}

  async create(
    tenantId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequestDocument> {
    this.logger.log(
      `[HR] Tenant ${tenantId} — createLeaveRequest employee="${dto.employeeId}" type="${dto.leaveType}"`,
    );
    const request = new this.leaveRequestModel({ ...dto, tenantId });
    return request.save();
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: LeaveRequestDocument[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.leaveRequestModel
        .find({ tenantId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.leaveRequestModel.countDocuments({ tenantId }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(tenantId: string, id: string): Promise<LeaveRequestDocument> {
    const request = await this.leaveRequestModel.findOne({ _id: id, tenantId }).exec();
    if (!request) {
      throw new NotFoundException(`LeaveRequest ${id} not found`);
    }
    return request;
  }

  async approve(
    tenantId: string,
    id: string,
    approvedBy: string,
  ): Promise<LeaveRequestDocument> {
    const request = await this.leaveRequestModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        { $set: { status: 'approved', approvedBy } },
        { new: true },
      )
      .exec();
    if (!request) {
      throw new NotFoundException(`LeaveRequest ${id} not found`);
    }
    return request;
  }

  async reject(
    tenantId: string,
    id: string,
    approvedBy: string,
    dto: ApproveLeaveRequestDto,
  ): Promise<LeaveRequestDocument> {
    const request = await this.leaveRequestModel
      .findOneAndUpdate(
        { _id: id, tenantId },
        {
          $set: {
            status: 'rejected',
            approvedBy,
            rejectionReason: dto.rejectionReason,
          },
        },
        { new: true },
      )
      .exec();
    if (!request) {
      throw new NotFoundException(`LeaveRequest ${id} not found`);
    }
    return request;
  }
}
