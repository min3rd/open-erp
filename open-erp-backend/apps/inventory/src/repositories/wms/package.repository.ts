import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WmsPackage, WmsPackageDocument, WmsPackageStatus } from '@shared/schemas';

@Injectable()
export class WmsPackageRepository {
  constructor(
    @InjectModel(WmsPackage.name) private readonly packageModel: Model<WmsPackageDocument>,
  ) {}

  async create(data: Partial<WmsPackage>): Promise<WmsPackageDocument> {
    return this.packageModel.create(data);
  }

  async findById(id: string): Promise<WmsPackageDocument | null> {
    return this.packageModel.findById(id).exec();
  }

  async update(id: string, data: Partial<WmsPackage>): Promise<WmsPackageDocument | null> {
    return this.packageModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async findAll(
    filter: {
      orgId?: string;
      shipmentId?: string;
      status?: WmsPackageStatus;
    } = {},
    options: { skip?: number; limit?: number } = {},
  ) {
    const { skip = 0, limit = 20 } = options;
    const query: any = { deletedAt: null };

    if (filter.orgId) query.orgId = new Types.ObjectId(filter.orgId);
    if (filter.shipmentId) query.shipmentId = new Types.ObjectId(filter.shipmentId);
    if (filter.status) query.status = filter.status;

    const [items, total] = await Promise.all([
      this.packageModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.packageModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }
}
