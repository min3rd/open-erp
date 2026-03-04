import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shipment, ShipmentDocument, ShipmentStatus } from '@shared/schemas';

@Injectable()
export class ShipmentRepository {
  constructor(
    @InjectModel(Shipment.name) private readonly shipmentModel: Model<ShipmentDocument>,
  ) {}

  async create(data: Partial<Shipment>): Promise<ShipmentDocument> {
    return this.shipmentModel.create(data);
  }

  async findById(id: string): Promise<ShipmentDocument | null> {
    return this.shipmentModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Shipment>): Promise<ShipmentDocument | null> {
    return this.shipmentModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
  }

  async findAll(
    filter: {
      orgId?: string;
      warehouseId?: string;
      status?: ShipmentStatus;
    } = {},
    options: { skip?: number; limit?: number } = {},
  ) {
    const { skip = 0, limit = 20 } = options;
    const query: any = { deletedAt: null };

    if (filter.orgId) query.orgId = new Types.ObjectId(filter.orgId);
    if (filter.warehouseId) query.warehouseId = new Types.ObjectId(filter.warehouseId);
    if (filter.status) query.status = filter.status;

    const [items, total] = await Promise.all([
      this.shipmentModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.shipmentModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async softDelete(id: string): Promise<ShipmentDocument | null> {
    return this.shipmentModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }
}
