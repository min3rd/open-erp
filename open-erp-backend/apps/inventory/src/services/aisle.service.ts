import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { AisleRepository } from '../repositories/aisle.repository';
import {
  CreateAisleDto,
  UpdateAisleDto,
  QueryAisleDto,
} from '../dto/aisle.dto';
import { AisleDocument } from '@shared/schemas';

@Injectable()
export class AisleService {
  private readonly logger = new Logger(AisleService.name);

  constructor(private readonly aisleRepository: AisleRepository) {}

  async create(zoneId: string, dto: CreateAisleDto): Promise<AisleDocument> {
    this.logger.log(`Creating aisle ${dto.code} in zone ${zoneId}`);
    const existing = await this.aisleRepository.findByCode(zoneId, dto.code);
    if (existing) {
      throw new ConflictException(
        `Aisle with code ${dto.code} already exists in this zone`,
      );
    }
    try {
      return await this.aisleRepository.create(zoneId, dto);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Aisle with code ${dto.code} already exists in this zone`,
        );
      }
      throw error;
    }
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
    return this.aisleRepository.findAll(zoneId, query);
  }

  async findById(id: string): Promise<AisleDocument> {
    const aisle = await this.aisleRepository.findById(id);
    if (!aisle) throw new NotFoundException(`Aisle with ID ${id} not found`);
    return aisle;
  }

  async update(id: string, dto: UpdateAisleDto): Promise<AisleDocument> {
    const existing = await this.aisleRepository.findById(id);
    if (!existing) throw new NotFoundException(`Aisle with ID ${id} not found`);

    if (dto.code && dto.code !== existing.code) {
      const codeConflict = await this.aisleRepository.findByCode(
        existing.zoneId.toString(),
        dto.code,
      );
      if (codeConflict) {
        throw new ConflictException(
          `Aisle with code ${dto.code} already exists in this zone`,
        );
      }
    }

    try {
      const updated = await this.aisleRepository.update(id, dto);
      if (!updated)
        throw new NotFoundException(`Aisle with ID ${id} not found`);
      return updated;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Aisle with code ${dto.code} already exists in this zone`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const aisle = await this.aisleRepository.findById(id);
    if (!aisle) throw new NotFoundException(`Aisle with ID ${id} not found`);
    await this.aisleRepository.softDelete(id);
    this.logger.log(`Soft-deleted aisle ${id}`);
  }
}
