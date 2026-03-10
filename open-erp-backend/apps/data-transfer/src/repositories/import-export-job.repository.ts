import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImportExportJob, ImportExportJobDocument } from '@shared/schemas';

export interface FindJobsOptions {
  q?: string;
  type?: string;
  entity?: string;
  status?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable()
export class ImportExportJobRepository {
  constructor(
    @InjectModel(ImportExportJob.name)
    private readonly model: Model<ImportExportJobDocument>,
  ) {}

  async create(
    data: Partial<ImportExportJob>,
  ): Promise<ImportExportJobDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<ImportExportJobDocument | null> {
    return this.model.findById(id).exec();
  }

  async updateById(
    id: string,
    data: Partial<ImportExportJob>,
  ): Promise<ImportExportJobDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async findByUser(
    userId: string,
    options: FindJobsOptions = {},
  ): Promise<{ items: ImportExportJobDocument[]; total: number }> {
    const {
      q,
      type,
      entity,
      status,
      sortField = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = options;

    const query: Record<string, any> = { userId: new Types.ObjectId(userId) };
    if (type) query.type = type;
    if (status) query.status = status;
    // q overrides entity filter for search
    if (q) {
      query.entity = { $regex: q, $options: 'i' };
    } else if (entity) {
      query.entity = entity;
    }

    const sort: Record<string, 1 | -1> = {
      [sortField]: sortOrder === 'asc' ? 1 : -1,
    };

    const [items, total] = await Promise.all([
      this.model
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { items, total };
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ items: ImportExportJobDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.model
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.model.countDocuments().exec(),
    ]);
    return { items, total };
  }
}
