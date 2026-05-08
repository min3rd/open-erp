import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ImportExportJob,
  ImportExportJobDocument,
  JobStatus,
} from '@shared/schemas';

@Injectable()
export class WmsImportJobRepository {
  constructor(
    @InjectModel(ImportExportJob.name)
    private readonly jobModel: Model<ImportExportJobDocument>,
  ) {}

  async create(
    tenantId: string,
    data: Partial<ImportExportJob>,
  ): Promise<ImportExportJobDocument> {
    const doc = new this.jobModel({ ...data, tenantId });
    return doc.save();
  }

  async findByIdAndTenant(
    tenantId: string,
    id: string,
  ): Promise<ImportExportJobDocument | null> {
    return this.jobModel
      .findOne({ _id: new Types.ObjectId(id), tenantId })
      .exec();
  }

  async findByTenant(
    tenantId: string,
    filter: { status?: JobStatus; entity?: string } = {},
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ items: ImportExportJobDocument[]; total: number }> {
    const { skip = 0, limit = 20 } = options;
    const query: Record<string, unknown> = { tenantId };

    if (filter.status) query.status = filter.status;
    if (filter.entity) query.entity = filter.entity;

    const [items, total] = await Promise.all([
      this.jobModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.jobModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: JobStatus,
    extra: Partial<ImportExportJob> = {},
  ): Promise<ImportExportJobDocument | null> {
    return this.jobModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), tenantId },
      { $set: { status, ...extra } },
      { new: true },
    );
  }
}
