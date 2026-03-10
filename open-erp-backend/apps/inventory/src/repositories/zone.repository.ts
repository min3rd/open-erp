import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Zone, ZoneDocument } from '@shared/schemas';
import { LayoutPosition } from '@shared/schemas';
import { CreateZoneDto, UpdateZoneDto, QueryZoneDto } from '../dto/zone.dto';

@Injectable()
export class ZoneRepository {
  constructor(
    @InjectModel(Zone.name)
    private readonly zoneModel: Model<ZoneDocument>,
  ) {}

  async create(warehouseId: string, dto: CreateZoneDto): Promise<ZoneDocument> {
    const zone = new this.zoneModel({ ...dto, warehouseId });
    return zone.save();
  }

  async findAll(
    warehouseId: string,
    query: QueryZoneDto,
  ): Promise<{
    items: ZoneDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 50, type, search } = query;
    const filter: Record<string, any> = { warehouseId };

    if (type) filter['type'] = type;
    if (search) {
      filter['$or'] = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.zoneModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ sequence: 1, createdAt: 1 })
        .exec(),
      this.zoneModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<ZoneDocument | null> {
    return this.zoneModel.findById(id).exec();
  }

  async findByCode(
    warehouseId: string,
    code: string,
  ): Promise<ZoneDocument | null> {
    return this.zoneModel.findOne({ warehouseId, code } as any).exec();
  }

  async update(id: string, dto: UpdateZoneDto): Promise<ZoneDocument | null> {
    return this.zoneModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
  }

  async softDelete(id: string): Promise<ZoneDocument | null> {
    return this.zoneModel
      .findByIdAndUpdate(
        id,
        { deletedAt: new Date(), isActive: false },
        { new: true },
      )
      .exec();
  }

  async countByWarehouse(warehouseId: string): Promise<number> {
    return this.zoneModel.countDocuments({ warehouseId } as any).exec();
  }

  async findAllByWarehouse(warehouseId: string): Promise<ZoneDocument[]> {
    return this.zoneModel
      .find({ warehouseId } as any)
      .sort({ sequence: 1, createdAt: 1 })
      .exec();
  }

  async upsertByCode(
    warehouseId: string,
    code: string,
    name: string,
    layout: Partial<LayoutPosition>,
  ): Promise<ZoneDocument> {
    return this.zoneModel
      .findOneAndUpdate(
        { warehouseId, code } as any,
        { $set: { name, layout } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec() as Promise<ZoneDocument>;
  }

  async updateLayout(
    id: string,
    name: string,
    layout: Partial<LayoutPosition>,
  ): Promise<ZoneDocument | null> {
    return this.zoneModel
      .findByIdAndUpdate(id, { $set: { name, layout } }, { new: true })
      .exec();
  }

  async clearLayout(id: string): Promise<ZoneDocument | null> {
    return this.zoneModel
      .findByIdAndUpdate(id, { $set: { layout: null } }, { new: true })
      .exec();
  }
}
