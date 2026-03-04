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
    return this.picklistModel.create(data);
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
    } = {},
    options: { skip?: number; limit?: number } = {},
  ) {
    const { skip = 0, limit = 20 } = options;
    const query: any = { deletedAt: null };

    if (filter.orgId) query.orgId = new Types.ObjectId(filter.orgId);
    if (filter.warehouseId) query.warehouseId = new Types.ObjectId(filter.warehouseId);
    if (filter.status) query.status = filter.status;

    const [items, total] = await Promise.all([
      this.picklistModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
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
