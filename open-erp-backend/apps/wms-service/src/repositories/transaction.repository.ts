import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { InventoryTransaction, InventoryTransactionDocument } from '@shared/schemas';
import { InventoryTransactionType, TransactionStatus } from '@shared/constants';

export interface CreateTransactionData {
  tenantId: string;
  type: InventoryTransactionType;
  status: TransactionStatus;
  productId: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  quantity: number;
  referenceNo?: string;
  reason?: string;
  createdById?: string;
  lotNumber?: string;
}

@Injectable()
export class WmsTransactionRepository {
  constructor(
    @InjectModel(InventoryTransaction.name)
    private readonly txModel: Model<InventoryTransactionDocument>,
  ) {}

  async createWithSession(
    data: CreateTransactionData,
    session?: ClientSession,
  ): Promise<InventoryTransactionDocument> {
    const doc = new this.txModel({
      ...data,
      productId: new Types.ObjectId(data.productId),
      sourceWarehouseId: data.sourceWarehouseId
        ? new Types.ObjectId(data.sourceWarehouseId)
        : undefined,
      destinationWarehouseId: data.destinationWarehouseId
        ? new Types.ObjectId(data.destinationWarehouseId)
        : undefined,
      createdBy: data.createdById
        ? new Types.ObjectId(data.createdById)
        : undefined,
      transactionDate: new Date(),
    });
    return doc.save({ session: session ?? undefined });
  }

  async findByTenant(
    tenantId: string,
    filter: {
      warehouseId?: string;
      type?: InventoryTransactionType;
      status?: TransactionStatus;
      referenceNo?: string;
    } = {},
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ items: InventoryTransactionDocument[]; total: number }> {
    const { skip = 0, limit = 20 } = options;
    const query: Record<string, unknown> = { tenantId };

    if (filter.warehouseId) {
      const wId = new Types.ObjectId(filter.warehouseId);
      query.$or = [
        { sourceWarehouseId: wId },
        { destinationWarehouseId: wId },
      ];
    }
    if (filter.type) query.type = filter.type;
    if (filter.status) query.status = filter.status;
    if (filter.referenceNo) query.referenceNo = filter.referenceNo;

    const [items, total] = await Promise.all([
      this.txModel.find(query).skip(skip).limit(limit).sort({ transactionDate: -1 }).exec(),
      this.txModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async findByIdAndTenant(
    tenantId: string,
    id: string,
  ): Promise<InventoryTransactionDocument | null> {
    return this.txModel.findOne({ _id: new Types.ObjectId(id), tenantId }).exec();
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: TransactionStatus,
    session?: ClientSession,
  ): Promise<InventoryTransactionDocument | null> {
    return this.txModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), tenantId },
      { $set: { status } },
      { new: true, session: session ?? undefined },
    );
  }
}
