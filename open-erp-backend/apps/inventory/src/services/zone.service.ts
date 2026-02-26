import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ZoneRepository } from '../repositories/zone.repository';
import { CreateZoneDto, UpdateZoneDto, QueryZoneDto } from '../dto/zone.dto';
import { ZoneDocument } from '@shared/schemas';

@Injectable()
export class ZoneService {
  private readonly logger = new Logger(ZoneService.name);

  constructor(private readonly zoneRepository: ZoneRepository) {}

  async create(warehouseId: string, dto: CreateZoneDto): Promise<ZoneDocument> {
    this.logger.log(`Creating zone ${dto.code} in warehouse ${warehouseId}`);
    const existing = await this.zoneRepository.findByCode(warehouseId, dto.code);
    if (existing) {
      throw new ConflictException(`Zone with code ${dto.code} already exists in this warehouse`);
    }
    try {
      return await this.zoneRepository.create(warehouseId, dto);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Zone with code ${dto.code} already exists in this warehouse`);
      }
      throw error;
    }
  }

  async findAll(
    warehouseId: string,
    query: QueryZoneDto,
  ): Promise<{ items: ZoneDocument[]; total: number; page: number; limit: number }> {
    return this.zoneRepository.findAll(warehouseId, query);
  }

  async findById(id: string): Promise<ZoneDocument> {
    const zone = await this.zoneRepository.findById(id);
    if (!zone) throw new NotFoundException(`Zone with ID ${id} not found`);
    return zone;
  }

  async update(id: string, dto: UpdateZoneDto): Promise<ZoneDocument> {
    const existing = await this.zoneRepository.findById(id);
    if (!existing) throw new NotFoundException(`Zone with ID ${id} not found`);

    if (dto.code && dto.code !== existing.code) {
      const codeConflict = await this.zoneRepository.findByCode(
        existing.warehouseId.toString(),
        dto.code,
      );
      if (codeConflict) {
        throw new ConflictException(`Zone with code ${dto.code} already exists in this warehouse`);
      }
    }

    try {
      const updated = await this.zoneRepository.update(id, dto);
      if (!updated) throw new NotFoundException(`Zone with ID ${id} not found`);
      return updated;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Zone with code ${dto.code} already exists in this warehouse`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const zone = await this.zoneRepository.findById(id);
    if (!zone) throw new NotFoundException(`Zone with ID ${id} not found`);
    await this.zoneRepository.softDelete(id);
    this.logger.log(`Soft-deleted zone ${id}`);
  }
}
