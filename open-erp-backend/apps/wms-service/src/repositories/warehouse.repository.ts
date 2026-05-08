import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Warehouse,
  WarehouseDocument,
  Province,
  ProvinceDocument,
  Ward,
  WardDocument,
} from '@shared/schemas';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  QueryWarehouseDto,
} from '../dto/warehouse.dto';

@Injectable()
export class WmsWarehouseRepository {
  constructor(
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(Province.name)
    private readonly provinceModel: Model<ProvinceDocument>,
    @InjectModel(Ward.name)
    private readonly wardModel: Model<WardDocument>,
  ) {}

  async create(
    createDto: CreateWarehouseDto,
    createdBy: string,
  ): Promise<WarehouseDocument> {
    const warehouse = new this.warehouseModel({ ...createDto, createdBy });
    return warehouse.save();
  }

  async findAll(query: QueryWarehouseDto): Promise<{
    items: WarehouseDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      provinceCode,
      wardCode,
      region,
      tenantId,
      search,
      bbox,
    } = query;

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (provinceCode) filter['province.code'] = provinceCode;
    if (wardCode) filter['ward.code'] = wardCode;
    if (region) filter.region = region;
    if (tenantId) filter.tenantId = tenantId;
    if (search) filter.$text = { $search: search };

    if (bbox) {
      const [lon, lat, radiusKm] = bbox.split(',').map(Number);
      if (lon && lat && radiusKm) {
        filter.location = {
          $near: {
            $geometry: { type: 'Point', coordinates: [lon, lat] },
            $maxDistance: radiusKm * 1000,
          },
        };
      }
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.warehouseModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.warehouseModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string): Promise<WarehouseDocument | null> {
    return this.warehouseModel.findById(id).exec();
  }

  async findByCode(code: string, tenantId?: string): Promise<WarehouseDocument | null> {
    const filter: any = { code };
    if (tenantId) filter.tenantId = tenantId;
    return this.warehouseModel.findOne(filter).exec();
  }

  async update(
    id: string,
    updateDto: UpdateWarehouseDto,
    updatedBy: string,
  ): Promise<WarehouseDocument | null> {
    return this.warehouseModel
      .findByIdAndUpdate(id, { ...updateDto, updatedBy }, { new: true, runValidators: true })
      .exec();
  }

  async softDelete(id: string): Promise<WarehouseDocument | null> {
    const warehouse = await this.warehouseModel.findById(id).exec();
    if (!warehouse) return null;
    return (warehouse as any).softDelete();
  }

  async provinceExists(code: string): Promise<boolean> {
    const province = await this.provinceModel.findOne({ code }).exec();
    return !!province;
  }

  async getWard(code: string, provinceCode: string): Promise<WardDocument | null> {
    return this.wardModel.findOne({ code, provinceCode }).exec();
  }

  async getAllProvinces(): Promise<ProvinceDocument[]> {
    return this.provinceModel.find().sort({ sortOrder: 1 }).exec();
  }

  async getWardsByProvince(provinceCode: string): Promise<WardDocument[]> {
    return this.wardModel.find({ provinceCode }).sort({ sortOrder: 1 }).exec();
  }
}
