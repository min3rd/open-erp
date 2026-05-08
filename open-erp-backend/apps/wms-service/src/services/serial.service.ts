import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { WmsSerialRepository } from '../repositories/serial.repository';
import { CreateSerialDto, UpdateSerialDto, QuerySerialDto } from '../dto/serial.dto';
import { SerialStatus } from '@shared/schemas';

@Injectable()
export class WmsSerialService {
  private readonly logger = new Logger(WmsSerialService.name);

  constructor(private readonly serialRepository: WmsSerialRepository) {}

  async create(createDto: CreateSerialDto, tenantId: string) {
    this.logger.log(
      `Registering serial: ${createDto.serial} for SKU: ${createDto.skuId}, tenant: ${tenantId}`,
    );

    const data: any = {
      skuId: new Types.ObjectId(createDto.skuId),
      serial: createDto.serial,
      status: SerialStatus.AVAILABLE,
      assignedAt: new Date(),
      organizationId: new Types.ObjectId(tenantId),
    };

    if (createDto.binId) {
      data.binId = new Types.ObjectId(createDto.binId);
    }
    if (createDto.lotId) {
      data.lotId = new Types.ObjectId(createDto.lotId);
    }

    return this.serialRepository.create(data);
  }

  async findAll(query: QuerySerialDto, tenantId: string) {
    const { page = 1, limit = 20, skuId, status, binId } = query;
    const skip = (page - 1) * limit;

    const filter: any = {
      organizationId: new Types.ObjectId(tenantId),
    };

    if (skuId) {
      filter.skuId = new Types.ObjectId(skuId);
    }
    if (status) {
      filter.status = status;
    }
    if (binId) {
      filter.binId = new Types.ObjectId(binId);
    }

    const result = await this.serialRepository.findAll(filter, { skip, limit });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async findById(id: string, tenantId: string) {
    const serial = await this.serialRepository.findById(id);
    if (!serial) {
      throw new NotFoundException('Serial not found');
    }
    if (serial.organizationId && serial.organizationId.toString() !== tenantId) {
      throw new NotFoundException('Serial not found');
    }
    return serial;
  }

  async update(id: string, updateDto: UpdateSerialDto, tenantId: string) {
    await this.findById(id, tenantId);

    const data: any = {};
    if (updateDto.status !== undefined) data.status = updateDto.status;
    if (updateDto.binId !== undefined) {
      data.binId = new Types.ObjectId(updateDto.binId);
    }
    if (updateDto.lotId !== undefined) {
      data.lotId = new Types.ObjectId(updateDto.lotId);
    }

    const serial = await this.serialRepository.update(id, data);
    if (!serial) {
      throw new NotFoundException('Serial not found');
    }
    return serial;
  }
}
