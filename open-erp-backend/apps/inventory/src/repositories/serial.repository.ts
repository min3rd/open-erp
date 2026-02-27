import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Serial, SerialDocument, SerialStatus } from '@shared/schemas';

@Injectable()
export class SerialRepository {
  constructor(
    @InjectModel(Serial.name)
    private readonly serialModel: Model<SerialDocument>,
  ) {}

  async create(data: Partial<Serial>): Promise<SerialDocument> {
    return this.serialModel.create(data);
  }

  async findById(id: string): Promise<SerialDocument | null> {
    return this.serialModel.findById(id).exec();
  }

  async update(
    id: string,
    data: Partial<Serial>,
  ): Promise<SerialDocument | null> {
    return this.serialModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async findBySkuId(
    skuId: string,
    options: {
      skip?: number;
      limit?: number;
      status?: SerialStatus;
      binId?: string;
    } = {},
  ) {
    const { skip = 0, limit = 20, status, binId } = options;
    const filter: any = {
      skuId: new Types.ObjectId(skuId),
      deletedAt: null,
    };
    if (status) filter.status = status;
    if (binId) filter.binId = new Types.ObjectId(binId);

    const [items, total] = await Promise.all([
      this.serialModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.serialModel.countDocuments(filter).exec(),
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
      this.serialModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.serialModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async softDelete(id: string): Promise<SerialDocument | null> {
    return this.serialModel
      .findByIdAndUpdate(
        id,
        { $set: { deletedAt: new Date() } },
        { new: true },
      )
      .exec();
  }
}
