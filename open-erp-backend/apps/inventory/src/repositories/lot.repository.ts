import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lot, LotDocument } from '@shared/schemas';

@Injectable()
export class LotRepository {
  constructor(
    @InjectModel(Lot.name) private readonly lotModel: Model<LotDocument>,
  ) {}

  async create(data: Partial<Lot>): Promise<LotDocument> {
    return this.lotModel.create(data);
  }

  async findById(id: string): Promise<LotDocument | null> {
    return this.lotModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Lot>): Promise<LotDocument | null> {
    return this.lotModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async findBySkuId(
    skuId: string,
    options: { skip?: number; limit?: number; expired?: boolean } = {},
  ) {
    const { skip = 0, limit = 20, expired } = options;
    const filter: any = {
      skuId: new Types.ObjectId(skuId),
      deletedAt: null,
    };

    if (expired === true) {
      filter.expiryAt = { $lte: new Date() };
    } else if (expired === false) {
      filter.$or = [
        { expiryAt: null },
        { expiryAt: { $gt: new Date() } },
      ];
    }

    const [items, total] = await Promise.all([
      this.lotModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.lotModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findAll(
    filter: any = {},
    options: { skip?: number; limit?: number } = {},
  ) {
    const { skip = 0, limit = 20 } = options;
    const query: any = { deletedAt: null, ...filter };

    const [items, total] = await Promise.all([
      this.lotModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.lotModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async softDelete(id: string): Promise<LotDocument | null> {
    return this.lotModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }
}
