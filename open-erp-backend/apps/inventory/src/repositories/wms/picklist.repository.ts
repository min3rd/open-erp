import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Picklist, PicklistDocument, PicklistStatus } from '@shared/schemas';

@Injectable()
export class PicklistRepository {
  constructor(
    @InjectModel(Picklist.name) private readonly picklistModel: Model<PicklistDocument>,
  ) {}

  async create(data: Partial<Picklist>): Promise<PicklistDocument> {
    const doc = new this.picklistModel(data);
    return doc.save();
  }

  async findById(id: string): Promise<PicklistDocument | null> {
    return this.picklistModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Picklist>): Promise<PicklistDocument | null> {
    return this.picklistModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async findAll(
    filter: {
      orgId?: string;
      warehouseId?: string;
      status?: PicklistStatus;
      q?: string;
    } = {},
    options: {
      skip?: number;
      limit?: number;
      sortField?: string;
      sortOrder?: 1 | -1;
    } = {},
  ) {
    const { skip = 0, limit = 20, sortField = 'createdAt', sortOrder = -1 } = options;
    const query: any = { deletedAt: null };

    if (filter.orgId) query.orgId = new Types.ObjectId(filter.orgId);
    if (filter.warehouseId) query.warehouseId = new Types.ObjectId(filter.warehouseId);
    if (filter.status) query.status = filter.status;
    if (filter.q) {
      const regex = { $regex: filter.q, $options: 'i' };
      query.$or = [
        { notes: regex },
        { 'lines.skuCode': regex },
        { 'lines.skuName': regex },
      ];
    }

    const sortObj: any = { [sortField]: sortOrder };

    const [items, total] = await Promise.all([
      this.picklistModel.find(query).skip(skip).limit(limit).sort(sortObj).exec(),
      this.picklistModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async softDelete(id: string): Promise<PicklistDocument | null> {
    return this.picklistModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }
}
