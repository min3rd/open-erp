import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bin, BinDocument } from '@shared/schemas';
import { LayoutPosition } from '@shared/schemas';
import { CreateBinDto, UpdateBinDto, QueryBinDto } from '../dto/bin.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BinRepository {
  constructor(
    @InjectModel(Bin.name)
    private readonly binModel: Model<BinDocument>,
  ) {}

  async create(aisleId: string, dto: CreateBinDto): Promise<BinDocument> {
    const barcode = dto.barcode || `BIN-${uuidv4().substring(0, 8).toUpperCase()}`;
    const bin = new this.binModel({ ...dto, aisleId, barcode });
    return bin.save();
  }

  async findAll(
    aisleId: string,
    query: QueryBinDto,
  ): Promise<{ items: BinDocument[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 100, binType, search, availableOnly } = query;
    const filter: Record<string, any> = { aisleId };

    if (binType) filter['binType'] = binType;
    if (availableOnly) {
      filter['isBlocked'] = false;
      filter['$expr'] = { $lt: ['$currentQty', '$capacityQty'] };
    }
    if (search) {
      filter['$or'] = [
        { code: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.binModel.find(filter).skip(skip).limit(limit).sort({ code: 1 }).exec(),
      this.binModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<BinDocument | null> {
    return this.binModel.findById(id).exec();
  }

  async findByCode(aisleId: string, code: string): Promise<BinDocument | null> {
    return this.binModel.findOne({ aisleId, code } as any).exec();
  }

  async findByBarcode(barcode: string): Promise<BinDocument | null> {
    return this.binModel.findOne({ barcode }).exec();
  }

  async update(id: string, dto: UpdateBinDto): Promise<BinDocument | null> {
    return this.binModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
  }

  async softDelete(id: string): Promise<BinDocument | null> {
    return this.binModel
      .findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false }, { new: true })
      .exec();
  }

  async findByAisleId(aisleId: string): Promise<BinDocument[]> {
    return this.binModel.find({ aisleId } as any).sort({ code: 1 }).exec();
  }

  async countByAisle(aisleId: string): Promise<number> {
    return this.binModel.countDocuments({ aisleId } as any).exec();
  }

  async getTotalCurrentQtyByAisle(aisleId: string): Promise<number> {
    const result = await this.binModel.aggregate([
      { $match: { aisleId: aisleId, deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$currentQty' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async findAllByAisleIds(aisleIds: string[]): Promise<BinDocument[]> {
    return this.binModel
      .find({ aisleId: { $in: aisleIds } } as any)
      .sort({ createdAt: 1 })
      .exec();
  }

  async upsertByAisleAndCode(
    aisleId: string,
    code: string,
    name: string,
    layout: Partial<LayoutPosition>,
    extra: { barcode?: string; capacityQty?: number; isBlocked?: boolean; allowedSkuTags?: string[] },
  ): Promise<BinDocument> {
    const barcode = extra.barcode || `BIN-${code}`;
    return this.binModel
      .findOneAndUpdate(
        { aisleId, code } as any,
        { $set: { name: name || code, layout, barcode, capacityQty: extra.capacityQty ?? 0, isBlocked: extra.isBlocked ?? false, allowedSkuTags: extra.allowedSkuTags ?? [] } },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: false },
      )
      .exec() as Promise<BinDocument>;
  }

  async updateLayout(id: string, name: string, layout: Partial<LayoutPosition>): Promise<BinDocument | null> {
    return this.binModel.findByIdAndUpdate(id, { $set: { name: name || undefined, layout } }, { new: true }).exec();
  }

  async clearLayout(id: string): Promise<BinDocument | null> {
    return this.binModel.findByIdAndUpdate(id, { $set: { layout: null } }, { new: true }).exec();
  }
}
