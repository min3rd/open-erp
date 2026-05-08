import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { WmsLotRepository } from '../repositories/lot.repository';
import { CreateLotDto, UpdateLotDto, QueryLotDto } from '../dto/lot.dto';

@Injectable()
export class WmsLotService {
  private readonly logger = new Logger(WmsLotService.name);

  constructor(private readonly lotRepository: WmsLotRepository) {}

  async create(createDto: CreateLotDto, tenantId: string) {
    this.logger.log(
      `Creating lot: ${createDto.lotCode} for SKU: ${createDto.skuId}, tenant: ${tenantId}`,
    );

    const data: any = {
      skuId: new Types.ObjectId(createDto.skuId),
      lotCode: createDto.lotCode,
      totalQty: createDto.totalQty || 0,
      remainingQty: createDto.remainingQty ?? createDto.totalQty ?? 0,
      organizationId: new Types.ObjectId(tenantId),
    };

    if (createDto.manufacturedAt) {
      data.manufacturedAt = new Date(createDto.manufacturedAt);
    }
    if (createDto.expiryAt) {
      data.expiryAt = new Date(createDto.expiryAt);
    }

    return this.lotRepository.create(data);
  }

  async findAll(query: QueryLotDto, tenantId: string) {
    const { page = 1, limit = 20, skuId, expired } = query;
    const skip = (page - 1) * limit;

    const filter: any = {
      organizationId: new Types.ObjectId(tenantId),
    };

    if (skuId) {
      filter.skuId = new Types.ObjectId(skuId);
    }
    if (expired === true) {
      filter.expiryAt = { $lte: new Date() };
    } else if (expired === false) {
      filter.$or = [{ expiryAt: null }, { expiryAt: { $gt: new Date() } }];
    }

    const result = await this.lotRepository.findAll(filter, { skip, limit });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async findById(id: string, tenantId: string) {
    const lot = await this.lotRepository.findById(id);
    if (!lot) {
      throw new NotFoundException('Lot not found');
    }
    if (lot.organizationId && lot.organizationId.toString() !== tenantId) {
      throw new NotFoundException('Lot not found');
    }
    return lot;
  }

  async update(id: string, updateDto: UpdateLotDto, tenantId: string) {
    await this.findById(id, tenantId);

    const data: any = {};
    if (updateDto.lotCode !== undefined) data.lotCode = updateDto.lotCode;
    if (updateDto.manufacturedAt !== undefined) {
      data.manufacturedAt = new Date(updateDto.manufacturedAt);
    }
    if (updateDto.expiryAt !== undefined) {
      data.expiryAt = new Date(updateDto.expiryAt);
    }
    if (updateDto.totalQty !== undefined) data.totalQty = updateDto.totalQty;
    if (updateDto.remainingQty !== undefined) data.remainingQty = updateDto.remainingQty;

    const lot = await this.lotRepository.update(id, data);
    if (!lot) {
      throw new NotFoundException('Lot not found');
    }
    return lot;
  }
}
