import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Receipt, ReceiptDocument, ReceiptStatus } from '@shared/schemas';

@Injectable()
export class ReceiptRepository {
  constructor(
    @InjectModel(Receipt.name)
    private readonly receiptModel: Model<ReceiptDocument>,
  ) {}

  async create(data: Partial<Receipt>): Promise<ReceiptDocument> {
    const doc = new this.receiptModel(data);
    return doc.save();
  }

  async findById(id: string): Promise<ReceiptDocument | null> {
    return this.receiptModel.findById(id).exec();
  }

  async update(
    id: string,
    data: Partial<Receipt>,
  ): Promise<ReceiptDocument | null> {
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
      q?: string;
    } = {},
    options: {
      skip?: number;
      limit?: number;
      sortField?: string;
      sortOrder?: 1 | -1;
    } = {},
  ) {
    const {
      skip = 0,
      limit = 20,
      sortField = 'createdAt',
      sortOrder = -1,
    } = options;
    const query: any = { deletedAt: null };

    if (filter.orgId) query.orgId = new Types.ObjectId(filter.orgId);
    if (filter.warehouseId)
      query.warehouseId = new Types.ObjectId(filter.warehouseId);
    if (filter.poId) query.poId = filter.poId;
    if (filter.status) query.status = filter.status;
    if (filter.q) {
      const regex = { $regex: filter.q, $options: 'i' };
      query.$or = [{ poId: regex }, { supplier: regex }, { notes: regex }];
    }

    const sortObj: any = { [sortField]: sortOrder };

    const [items, total] = await Promise.all([
      this.receiptModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortObj)
        .exec(),
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
