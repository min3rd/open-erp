import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { InventoryStock, InventoryStockDocument } from '@shared/schemas';

@Injectable()
export class WmsStockRepository {
  constructor(
    @InjectModel(InventoryStock.name)
    private readonly stockModel: Model<InventoryStockDocument>,
  ) {}

  async findByTenant(
    tenantId: string,
    filter: {
      warehouseId?: string;
      productId?: string;
      sku?: string;
      q?: string;
    } = {},
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ items: InventoryStockDocument[]; total: number }> {
    const { skip = 0, limit = 20 } = options;
    const query: Record<string, unknown> = { organizationId: new Types.ObjectId(tenantId) };

    if (filter.warehouseId) {
      query.warehouseId = new Types.ObjectId(filter.warehouseId);
    }
    if (filter.productId) {
      query.productId = new Types.ObjectId(filter.productId);
    }
    if (filter.sku) {
      query['productSnapshot.sku'] = { $regex: filter.sku, $options: 'i' };
    }
    if (filter.q) {
      query.$or = [
        { 'productSnapshot.sku': { $regex: filter.q, $options: 'i' } },
        { 'productSnapshot.name': { $regex: filter.q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.stockModel.find(query).skip(skip).limit(limit).sort({ updatedAt: -1 }).exec(),
      this.stockModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async findOneByTenantAndProduct(
    tenantId: string,
    productId: string,
    warehouseId: string,
    session?: ClientSession,
  ): Promise<InventoryStockDocument | null> {
    return this.stockModel
      .findOne({
        organizationId: new Types.ObjectId(tenantId),
        productId: new Types.ObjectId(productId),
        warehouseId: new Types.ObjectId(warehouseId),
      } as any)
      .session(session ?? null)
      .exec();
  }

  async upsertStock(
    tenantId: string,
    productId: string,
    warehouseId: string,
    qtyDelta: number,
    session?: ClientSession,
  ): Promise<InventoryStockDocument> {
    return this.stockModel.findOneAndUpdate(
      {
        organizationId: new Types.ObjectId(tenantId),
        productId: new Types.ObjectId(productId),
        warehouseId: new Types.ObjectId(warehouseId),
      } as any,
      { $inc: { quantity: qtyDelta }, $set: { organizationId: new Types.ObjectId(tenantId) } },
      { upsert: true, new: true, session: session ?? undefined },
    ) as unknown as Promise<InventoryStockDocument>;
  }
}
