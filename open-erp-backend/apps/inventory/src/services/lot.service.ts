import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { LotRepository } from '../repositories/lot.repository';
import { CreateLotDto, UpdateLotDto } from '../dto/lot.dto';

@Injectable()
export class LotService {
  private readonly logger = new Logger(LotService.name);

  constructor(private readonly lotRepository: LotRepository) {}

  async create(createDto: CreateLotDto) {
    this.logger.log(
      `Creating lot: ${createDto.lotCode} for SKU: ${createDto.skuId}`,
    );

    const data: any = {
      skuId: new Types.ObjectId(createDto.skuId),
      lotCode: createDto.lotCode,
      totalQty: createDto.totalQty || 0,
      remainingQty: createDto.remainingQty ?? createDto.totalQty ?? 0,
    };

    if (createDto.organizationId) {
      data.organizationId = new Types.ObjectId(createDto.organizationId);
    }
    if (createDto.manufacturedAt) {
      data.manufacturedAt = new Date(createDto.manufacturedAt);
    }
    if (createDto.expiryAt) {
      data.expiryAt = new Date(createDto.expiryAt);
    }

    return this.lotRepository.create(data);
  }

  async findById(id: string) {
    const lot = await this.lotRepository.findById(id);
    if (!lot) {
      throw new NotFoundException('Lot not found');
    }
    return lot;
  }

  async update(id: string, updateDto: UpdateLotDto) {
    const data: any = {};
    if (updateDto.lotCode !== undefined) data.lotCode = updateDto.lotCode;
    if (updateDto.manufacturedAt !== undefined) {
      data.manufacturedAt = new Date(updateDto.manufacturedAt);
    }
    if (updateDto.expiryAt !== undefined) {
      data.expiryAt = new Date(updateDto.expiryAt);
    }
    if (updateDto.totalQty !== undefined) data.totalQty = updateDto.totalQty;
    if (updateDto.remainingQty !== undefined) {
      data.remainingQty = updateDto.remainingQty;
    }

    const lot = await this.lotRepository.update(id, data);
    if (!lot) {
      throw new NotFoundException('Lot not found');
    }
    return lot;
  }

  async findBySkuId(
    skuId: string,
    options: { page?: number; limit?: number; expired?: boolean } = {},
  ) {
    const { page = 1, limit = 20, expired } = options;
    const skip = (page - 1) * limit;

    const result = await this.lotRepository.findBySkuId(skuId, {
      skip,
      limit,
      expired,
    });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async findAll(
    filter: { skuId?: string; expired?: boolean } = {},
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filter.skuId) {
      query.skuId = new Types.ObjectId(filter.skuId);
    }

    if (filter.expired === true) {
      query.expiryAt = { $lte: new Date() };
    } else if (filter.expired === false) {
      query.$or = [{ expiryAt: null }, { expiryAt: { $gt: new Date() } }];
    }

    const result = await this.lotRepository.findAll(query, { skip, limit });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async validateNotExpired(lotId: string) {
    const lot = await this.findById(lotId);
    if (lot.expiryAt && lot.expiryAt < new Date()) {
      throw new BadRequestException(
        `Lot ${lot.lotCode} has expired on ${lot.expiryAt.toISOString()}`,
      );
    }
    return lot;
  }
}
