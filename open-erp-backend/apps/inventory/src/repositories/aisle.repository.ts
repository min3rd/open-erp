import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Aisle, AisleDocument } from '@shared/schemas';
import { LayoutPosition } from '@shared/schemas';
import {
  CreateAisleDto,
  UpdateAisleDto,
  QueryAisleDto,
} from '../dto/aisle.dto';

@Injectable()
export class AisleRepository {
  constructor(
    @InjectModel(Aisle.name)
    private readonly aisleModel: Model<AisleDocument>,
  ) {}

  async create(zoneId: string, dto: CreateAisleDto): Promise<AisleDocument> {
    const aisle = new this.aisleModel({ ...dto, zoneId });
    return aisle.save();
  }

  async findAll(
    zoneId: string,
    query: QueryAisleDto,
  ): Promise<{
    items: AisleDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 50, search } = query;
    const filter: Record<string, any> = { zoneId };

    if (search) {
      filter['$or'] = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.aisleModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ sequence: 1, createdAt: 1 })
        .exec(),
      this.aisleModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<AisleDocument | null> {
    return this.aisleModel.findById(id).exec();
  }

  async findByCode(
    zoneId: string,
    code: string,
  ): Promise<AisleDocument | null> {
    return this.aisleModel.findOne({ zoneId, code } as any).exec();
  }

  async update(id: string, dto: UpdateAisleDto): Promise<AisleDocument | null> {
    return this.aisleModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
  }

  async softDelete(id: string): Promise<AisleDocument | null> {
    return this.aisleModel
      .findByIdAndUpdate(
        id,
        { deletedAt: new Date(), isActive: false },
        { new: true },
      )
      .exec();
  }

  async findByZoneId(zoneId: string): Promise<AisleDocument[]> {
    return this.aisleModel
      .find({ zoneId } as any)
      .sort({ sequence: 1 })
      .exec();
  }

  async countByZone(zoneId: string): Promise<number> {
    return this.aisleModel.countDocuments({ zoneId } as any).exec();
  }

  async findAllByZoneIds(zoneIds: string[]): Promise<AisleDocument[]> {
    return this.aisleModel
      .find({ zoneId: { $in: zoneIds } } as any)
      .sort({ sequence: 1, createdAt: 1 })
      .exec();
  }

  async upsertByZoneAndCode(
    zoneId: string,
    code: string,
    name: string,
    layout: Partial<LayoutPosition>,
  ): Promise<AisleDocument> {
    return this.aisleModel
      .findOneAndUpdate(
        { zoneId, code } as any,
        { $set: { name, layout } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec() as Promise<AisleDocument>;
  }

  async updateLayout(
    id: string,
    name: string,
    layout: Partial<LayoutPosition>,
  ): Promise<AisleDocument | null> {
    return this.aisleModel
      .findByIdAndUpdate(id, { $set: { name, layout } }, { new: true })
      .exec();
  }

  async clearLayout(id: string): Promise<AisleDocument | null> {
    return this.aisleModel
      .findByIdAndUpdate(id, { $set: { layout: null } }, { new: true })
      .exec();
  }
}
