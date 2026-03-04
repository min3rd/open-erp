import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ImportExportJob, ImportExportJobDocument } from '@shared/schemas';

@Injectable()
export class ImportExportJobRepository {
  constructor(
    @InjectModel(ImportExportJob.name)
    private readonly model: Model<ImportExportJobDocument>,
  ) {}

  async create(data: Partial<ImportExportJob>): Promise<ImportExportJobDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<ImportExportJobDocument | null> {
    return this.model.findById(id).exec();
  }

  async updateById(id: string, data: Partial<ImportExportJob>): Promise<ImportExportJobDocument | null> {
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  }

  async findByUser(userId: string, page = 1, limit = 20): Promise<{ items: ImportExportJobDocument[]; total: number }> {
    const query = { userId: new Types.ObjectId(userId) };
    const [items, total] = await Promise.all([
      this.model.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { items, total };
  }

  async findAll(page = 1, limit = 20): Promise<{ items: ImportExportJobDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).exec(),
      this.model.countDocuments().exec(),
    ]);
    return { items, total };
  }
}
