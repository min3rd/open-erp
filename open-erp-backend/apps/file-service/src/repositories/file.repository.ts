import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { File, FileDocument } from '@shared/schemas/file.schema';
import {
  FileVersion,
  FileVersionDocument,
} from '@shared/schemas/file-version.schema';

@Injectable()
export class FileRepository {
  private readonly logger = new Logger(FileRepository.name);

  constructor(
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(FileVersion.name)
    private readonly fileVersionModel: Model<FileVersionDocument>,
  ) {}

  async create(data: Partial<File>): Promise<FileDocument> {
    const file = new this.fileModel(data);
    return file.save();
  }

  async findById(id: string): Promise<FileDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.fileModel.findById(id).exec();
  }

  async findByKey(key: string): Promise<FileDocument | null> {
    return this.fileModel.findOne({ key, isDeleted: false }).exec();
  }

  async findAll(
    filter: Record<string, any>,
    page: number,
    limit: number,
  ): Promise<{ items: FileDocument[]; total: number }> {
    const query = { isDeleted: false, ...filter };
    const [items, total] = await Promise.all([
      this.fileModel
        .find(query)
        .sort({ uploadedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.fileModel.countDocuments(query).exec(),
    ]);
    return { items, total };
  }

  async updateById(
    id: string,
    data: Partial<File>,
  ): Promise<FileDocument | null> {
    return this.fileModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<FileDocument | null> {
    return this.fileModel
      .findByIdAndUpdate(id, { $set: { isDeleted: true } }, { new: true })
      .exec();
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.fileModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async bulkSoftDelete(ids: string[]): Promise<number> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.fileModel
      .updateMany({ _id: { $in: objectIds } }, { $set: { isDeleted: true } })
      .exec();
    return result.modifiedCount;
  }

  async bulkHardDelete(ids: string[]): Promise<number> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const result = await this.fileModel
      .deleteMany({ _id: { $in: objectIds } })
      .exec();
    return result.deletedCount;
  }

  // File version methods
  async createVersion(
    data: Partial<FileVersion>,
  ): Promise<FileVersionDocument> {
    const version = new this.fileVersionModel(data);
    return version.save();
  }

  async findVersionsByFileId(fileId: string): Promise<FileVersionDocument[]> {
    return this.fileVersionModel
      .find({ fileId: new Types.ObjectId(fileId) })
      .sort({ version: -1 })
      .exec();
  }
}
