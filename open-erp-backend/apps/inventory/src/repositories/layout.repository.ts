import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WarehouseLayout,
  WarehouseLayoutDocument,
  LayoutObject,
  LayoutObjectDocument,
} from '@shared/schemas';
import {
  CreateLayoutDto,
  UpdateLayoutDto,
  CreateLayoutObjectDto,
  UpdateLayoutObjectDto,
  QueryLayoutObjectDto,
} from '../dto/layout.dto';

@Injectable()
export class LayoutRepository {
  constructor(
    @InjectModel(WarehouseLayout.name)
    private readonly layoutModel: Model<WarehouseLayoutDocument>,
    @InjectModel(LayoutObject.name)
    private readonly objectModel: Model<LayoutObjectDocument>,
  ) {}

  // ─── Layout ────────────────────────────────────────────────────────────────

  async findLayoutByWarehouse(warehouseId: string): Promise<WarehouseLayoutDocument | null> {
    return this.layoutModel.findOne({ warehouseId } as any).exec();
  }

  async createLayout(
    warehouseId: string,
    dto: CreateLayoutDto,
  ): Promise<WarehouseLayoutDocument> {
    const layout = new this.layoutModel({ ...dto, warehouseId });
    return layout.save();
  }

  async updateLayout(
    warehouseId: string,
    dto: UpdateLayoutDto,
  ): Promise<WarehouseLayoutDocument | null> {
    return this.layoutModel
      .findOneAndUpdate({ warehouseId } as any, dto, { new: true, runValidators: true })
      .exec();
  }

  // ─── Layout Objects ────────────────────────────────────────────────────────

  async findObjects(
    warehouseId: string,
    query: QueryLayoutObjectDto,
  ): Promise<{ items: LayoutObjectDocument[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 200, type, parentId } = query;
    const filter: Record<string, any> = { warehouseId };
    if (type) filter['type'] = type;
    if (parentId !== undefined) filter['parentId'] = parentId || null;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.objectModel.find(filter).skip(skip).limit(limit).sort({ type: 1, code: 1 }).exec(),
      this.objectModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  async findObjectById(id: string): Promise<LayoutObjectDocument | null> {
    return this.objectModel.findById(id).exec();
  }

  async findObjectByCode(
    warehouseId: string,
    code: string,
  ): Promise<LayoutObjectDocument | null> {
    return this.objectModel.findOne({ warehouseId, code } as any).exec();
  }

  async createObject(
    warehouseId: string,
    dto: CreateLayoutObjectDto,
  ): Promise<LayoutObjectDocument> {
    const obj = new this.objectModel({
      ...dto,
      warehouseId,
      x: dto.x ?? 0,
      y: dto.y ?? 0,
      rotationDeg: dto.rotationDeg ?? 0,
    });
    return obj.save();
  }

  async updateObject(
    id: string,
    dto: UpdateLayoutObjectDto,
  ): Promise<LayoutObjectDocument | null> {
    return this.objectModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
  }

  async softDeleteObject(id: string): Promise<LayoutObjectDocument | null> {
    return this.objectModel
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }

  async countChildren(parentId: string): Promise<number> {
    return this.objectModel.countDocuments({ parentId } as any).exec();
  }

  async countObjectsByWarehouse(warehouseId: string): Promise<number> {
    return this.objectModel.countDocuments({ warehouseId } as any).exec();
  }

  async deleteAllObjectsByWarehouse(warehouseId: string): Promise<void> {
    await this.objectModel.updateMany(
      { warehouseId } as any,
      { deletedAt: new Date() },
    ).exec();
  }
}
