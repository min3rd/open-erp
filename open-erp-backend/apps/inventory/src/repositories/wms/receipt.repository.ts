import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Receipt, ReceiptDocument, ReceiptStatus } from '@shared/schemas';

@Injectable()
export class ReceiptRepository {
  constructor(
    @InjectModel(Receipt.name) private readonly receiptModel: Model<ReceiptDocument>,
  ) {}

  async create(data: Partial<Receipt>): Promise<ReceiptDocument> {
    const doc = new this.receiptModel(data);
    return doc.save();
  }

  async findById(id: string): Promise<ReceiptDocument | null> {
    return this.receiptModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Receipt>): Promise<ReceiptDocument | null> {
    return this.receiptModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async findAll(
    filter: {
      orgId?: string;
      warehouseId?: string;
      poId?: string;
      status?: ReceiptStatus;
    } = {},
    options: { skip?: number; limit?: number } = {},
  ) {
    const { skip = 0, limit = 20 } = options;
    const query: any = { deletedAt: null };

    if (filter.orgId) query.orgId = new Types.ObjectId(filter.orgId);
    if (filter.warehouseId) query.warehouseId = new Types.ObjectId(filter.warehouseId);
    if (filter.poId) query.poId = filter.poId;
    if (filter.status) query.status = filter.status;

    const [items, total] = await Promise.all([
      this.receiptModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.receiptModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async softDelete(id: string): Promise<ReceiptDocument | null> {
    return this.receiptModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }
}
