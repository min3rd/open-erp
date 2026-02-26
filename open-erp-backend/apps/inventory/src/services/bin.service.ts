import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BinRepository } from '../repositories/bin.repository';
import { CreateBinDto, UpdateBinDto, QueryBinDto } from '../dto/bin.dto';
import { BinDocument } from '@shared/schemas';

@Injectable()
export class BinService {
  private readonly logger = new Logger(BinService.name);

  constructor(private readonly binRepository: BinRepository) {}

  async create(aisleId: string, dto: CreateBinDto): Promise<BinDocument> {
    this.logger.log(`Creating bin ${dto.code} in aisle ${aisleId}`);
    const existing = await this.binRepository.findByCode(aisleId, dto.code);
    if (existing) {
      throw new ConflictException(`Bin with code ${dto.code} already exists in this aisle`);
    }
    if (dto.barcode) {
      const barcodeConflict = await this.binRepository.findByBarcode(dto.barcode);
      if (barcodeConflict) {
        throw new ConflictException(`Bin with barcode ${dto.barcode} already exists`);
      }
    }
    try {
      return await this.binRepository.create(aisleId, dto);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Bin with code ${dto.code} already exists in this aisle`);
      }
      throw error;
    }
  }

  async findAll(
    aisleId: string,
    query: QueryBinDto,
  ): Promise<{ items: BinDocument[]; total: number; page: number; limit: number }> {
    return this.binRepository.findAll(aisleId, query);
  }

  async findById(id: string): Promise<BinDocument> {
    const bin = await this.binRepository.findById(id);
    if (!bin) throw new NotFoundException(`Bin with ID ${id} not found`);
    return bin;
  }

  async update(id: string, dto: UpdateBinDto): Promise<BinDocument> {
    const existing = await this.binRepository.findById(id);
    if (!existing) throw new NotFoundException(`Bin with ID ${id} not found`);

    if (dto.code && dto.code !== existing.code) {
      const codeConflict = await this.binRepository.findByCode(
        existing.aisleId.toString(),
        dto.code,
      );
      if (codeConflict) {
        throw new ConflictException(`Bin with code ${dto.code} already exists in this aisle`);
      }
    }

    try {
      const updated = await this.binRepository.update(id, dto);
      if (!updated) throw new NotFoundException(`Bin with ID ${id} not found`);
      return updated;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Bin with code ${dto.code} already exists in this aisle`);
      }
      throw error;
    }
  }

  async delete(id: string, force = false): Promise<void> {
    const bin = await this.binRepository.findById(id);
    if (!bin) throw new NotFoundException(`Bin with ID ${id} not found`);
    if (!force && bin.currentQty > 0) {
      throw new BadRequestException(
        `Cannot delete bin ${bin.code} with ${bin.currentQty} items in stock. Use force=true to override.`,
      );
    }
    await this.binRepository.softDelete(id);
    this.logger.log(`Soft-deleted bin ${id} (force=${force})`);
  }

  async block(id: string): Promise<BinDocument> {
    const bin = await this.binRepository.findById(id);
    if (!bin) throw new NotFoundException(`Bin with ID ${id} not found`);
    const updated = await this.binRepository.update(id, { isBlocked: true });
    return updated!;
  }

  async unblock(id: string): Promise<BinDocument> {
    const bin = await this.binRepository.findById(id);
    if (!bin) throw new NotFoundException(`Bin with ID ${id} not found`);
    const updated = await this.binRepository.update(id, { isBlocked: false });
    return updated!;
  }
}
