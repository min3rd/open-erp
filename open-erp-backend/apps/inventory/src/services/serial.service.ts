import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { SerialRepository } from '../repositories/serial.repository';
import { CreateSerialDto, UpdateSerialDto } from '../dto/serial.dto';
import { SerialStatus } from '@shared/schemas';

@Injectable()
export class SerialService {
  private readonly logger = new Logger(SerialService.name);

  constructor(private readonly serialRepository: SerialRepository) {}

  async create(createDto: CreateSerialDto) {
    this.logger.log(
      `Registering serial: ${createDto.serial} for SKU: ${createDto.skuId}`,
    );

    const data: any = {
      skuId: new Types.ObjectId(createDto.skuId),
      serial: createDto.serial,
      status: SerialStatus.AVAILABLE,
      assignedAt: new Date(),
    };

    if (createDto.organizationId) {
      data.organizationId = new Types.ObjectId(createDto.organizationId);
    }
    if (createDto.binId) {
      data.binId = new Types.ObjectId(createDto.binId);
    }
    if (createDto.lotId) {
      data.lotId = new Types.ObjectId(createDto.lotId);
    }

    return this.serialRepository.create(data);
  }

  async findById(id: string) {
    const serial = await this.serialRepository.findById(id);
    if (!serial) {
      throw new NotFoundException('Serial not found');
    }
    return serial;
  }

  async update(id: string, updateDto: UpdateSerialDto) {
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

  async findBySkuId(
    skuId: string,
    options: {
      page?: number;
      limit?: number;
      status?: SerialStatus;
      binId?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, status, binId } = options;
    const skip = (page - 1) * limit;

    const result = await this.serialRepository.findBySkuId(skuId, {
      skip,
      limit,
      status,
      binId,
    });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async findAll(
    filter: { skuId?: string; status?: SerialStatus; binId?: string } = {},
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filter.skuId) {
      query.skuId = new Types.ObjectId(filter.skuId);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.binId) {
      query.binId = new Types.ObjectId(filter.binId);
    }

    const result = await this.serialRepository.findAll(query, { skip, limit });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }
}
