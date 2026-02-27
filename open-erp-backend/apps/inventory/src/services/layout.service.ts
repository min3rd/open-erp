import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { LayoutRepository } from '../repositories/layout.repository';
import {
  CreateLayoutDto,
  UpdateLayoutDto,
  CreateLayoutObjectDto,
  UpdateLayoutObjectDto,
  QueryLayoutObjectDto,
} from '../dto/layout.dto';
import { WarehouseLayoutDocument, LayoutObjectDocument } from '@shared/schemas';
import { WarehouseRepository } from '../repositories/warehouse.repository';

@Injectable()
export class LayoutService {
  private readonly logger = new Logger(LayoutService.name);

  constructor(
    private readonly layoutRepository: LayoutRepository,
    private readonly warehouseRepository: WarehouseRepository,
  ) {}

  // ─── Layout ────────────────────────────────────────────────────────────────

  async getLayout(warehouseId: string): Promise<{
    layout: WarehouseLayoutDocument | null;
    objects: LayoutObjectDocument[];
  }> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    const layout = await this.layoutRepository.findLayoutByWarehouse(warehouseId);
    const { items: objects } = await this.layoutRepository.findObjects(warehouseId, {
      limit: 2000,
    });

    return { layout, objects };
  }

  async createLayout(
    warehouseId: string,
    dto: CreateLayoutDto,
  ): Promise<WarehouseLayoutDocument> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    const existing = await this.layoutRepository.findLayoutByWarehouse(warehouseId);
    if (existing) {
      throw new ConflictException(
        `Layout already exists for warehouse ${warehouseId}. Use PUT to update.`,
      );
    }

    this.logger.log(`Creating layout for warehouse ${warehouseId}`);
    return this.layoutRepository.createLayout(warehouseId, dto);
  }

  async updateLayout(
    warehouseId: string,
    dto: UpdateLayoutDto,
  ): Promise<WarehouseLayoutDocument> {
    const existing = await this.layoutRepository.findLayoutByWarehouse(warehouseId);
    if (!existing) {
      throw new NotFoundException(`No layout found for warehouse ${warehouseId}`);
    }

    const updated = await this.layoutRepository.updateLayout(warehouseId, dto);
    return updated!;
  }

  // ─── Layout Objects ────────────────────────────────────────────────────────

  async getObjects(
    warehouseId: string,
    query: QueryLayoutObjectDto,
  ): Promise<{ items: LayoutObjectDocument[]; total: number; page: number; limit: number }> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }
    return this.layoutRepository.findObjects(warehouseId, query);
  }

  async getObjectById(id: string): Promise<LayoutObjectDocument> {
    const obj = await this.layoutRepository.findObjectById(id);
    if (!obj) {
      throw new NotFoundException(`Layout object ${id} not found`);
    }
    return obj;
  }

  async createObject(
    warehouseId: string,
    dto: CreateLayoutObjectDto,
  ): Promise<LayoutObjectDocument> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.layoutRepository.findObjectById(dto.parentId);
      if (!parent) {
        throw new NotFoundException(`Parent layout object ${dto.parentId} not found`);
      }
    }

    // Check code uniqueness within warehouse
    const existing = await this.layoutRepository.findObjectByCode(warehouseId, dto.code);
    if (existing) {
      throw new ConflictException(
        `Layout object with code ${dto.code} already exists in this warehouse`,
      );
    }

    this.logger.log(`Creating ${dto.type} layout object '${dto.code}' in warehouse ${warehouseId}`);
    return this.layoutRepository.createObject(warehouseId, dto);
  }

  async updateObject(
    id: string,
    dto: UpdateLayoutObjectDto,
  ): Promise<LayoutObjectDocument> {
    const existing = await this.layoutRepository.findObjectById(id);
    if (!existing) {
      throw new NotFoundException(`Layout object ${id} not found`);
    }

    // If code changed, check uniqueness
    if (dto.code && dto.code !== existing.code) {
      const codeConflict = await this.layoutRepository.findObjectByCode(
        existing.warehouseId.toString(),
        dto.code,
      );
      if (codeConflict) {
        throw new ConflictException(
          `Layout object with code ${dto.code} already exists in this warehouse`,
        );
      }
    }

    const updated = await this.layoutRepository.updateObject(id, dto);
    return updated!;
  }

  async deleteObject(id: string, force = false): Promise<void> {
    const existing = await this.layoutRepository.findObjectById(id);
    if (!existing) {
      throw new NotFoundException(`Layout object ${id} not found`);
    }

    const childCount = await this.layoutRepository.countChildren(id);
    if (childCount > 0 && !force) {
      throw new BadRequestException(
        `Cannot delete layout object '${existing.code}' because it has ${childCount} child object(s). Use force=true to delete anyway.`,
      );
    }

    await this.layoutRepository.softDeleteObject(id);
    this.logger.log(`Soft-deleted layout object ${id}`);
  }

  async batchSaveObjects(
    warehouseId: string,
    objects: Array<CreateLayoutObjectDto & { id?: string }>,
  ): Promise<LayoutObjectDocument[]> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    // Upsert each object by (warehouseId, code) to prevent duplicate-key errors
    // when the same save is triggered twice or an object has already been persisted.
    return Promise.all(
      objects.map((obj) => this.layoutRepository.upsertObject(warehouseId, obj)),
    );
  }
}
