import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Serial, SerialDocument, SerialStatus } from '@shared/schemas';

@Injectable()
export class WmsSerialRepository {
  constructor(
    @InjectModel(Serial.name)
    private readonly serialModel: Model<SerialDocument>,
  ) {}

  async create(data: Partial<Serial>): Promise<SerialDocument> {
    const doc = new this.serialModel(data);
    return doc.save();
  }

  async findById(id: string): Promise<SerialDocument | null> {
    return this.serialModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Serial>): Promise<SerialDocument | null> {
    return this.serialModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async findAll(
    filter: any = {},
    options: { skip?: number; limit?: number } = {},
  ) {
    const { skip = 0, limit = 20 } = options;
    const query: any = { deletedAt: null, ...filter };

    const [items, total] = await Promise.all([
      this.serialModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.serialModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async softDelete(id: string): Promise<SerialDocument | null> {
    return this.serialModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }
}
