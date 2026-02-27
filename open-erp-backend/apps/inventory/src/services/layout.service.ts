import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { LayoutRepository } from '../repositories/layout.repository';
import { ZoneRepository } from '../repositories/zone.repository';
import { AisleRepository } from '../repositories/aisle.repository';
import { BinRepository } from '../repositories/bin.repository';
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
    private readonly zoneRepository: ZoneRepository,
    private readonly aisleRepository: AisleRepository,
    private readonly binRepository: BinRepository,
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

    // Process sequentially so zone refs are available before aisles/bins are saved
    const results: LayoutObjectDocument[] = [];
    for (const obj of objects) {
      const enriched = await this.syncEntityRef(warehouseId, obj, results);
      const saved = await this.layoutRepository.upsertObject(warehouseId, enriched);
      results.push(saved);
    }
    return results;
  }

  /**
   * For layout objects of type zone/aisle/bin, ensure a corresponding entity record
   * exists in the Zone/Aisle/Bin collections.  The entity ref (zoneRef/aisleRef/binRef)
   * is set on the returned DTO so the caller can persist it.
   */
  private async syncEntityRef(
    warehouseId: string,
    obj: CreateLayoutObjectDto & { id?: string },
    alreadySaved: LayoutObjectDocument[],
  ): Promise<CreateLayoutObjectDto & { id?: string }> {
    if (obj.type === 'zone') {
      if (obj.zoneRef) return obj; // already linked

      // Upsert Zone by (warehouseId, code)
      let zone = await this.zoneRepository.findByCode(warehouseId, obj.code);
      if (!zone) {
        zone = await this.zoneRepository.create(warehouseId, { code: obj.code, name: obj.name });
        this.logger.log(`Auto-created Zone '${obj.code}' for warehouse ${warehouseId}`);
      }
      return { ...obj, zoneRef: zone.id as string };
    }

    if (obj.type === 'aisle') {
      if (obj.aisleRef) return obj; // already linked

      // Resolve parent zone entity
      const parentZoneId = await this.resolveParentZoneId(warehouseId, obj, alreadySaved);
      if (!parentZoneId) {
        this.logger.warn(`Cannot auto-create Aisle '${obj.code}': no parent zone resolved`);
        return obj;
      }

      // Upsert Aisle by (zoneId, code)
      let aisle = await this.aisleRepository.findByCode(parentZoneId, obj.code);
      if (!aisle) {
        aisle = await this.aisleRepository.create(parentZoneId, { code: obj.code, name: obj.name });
        this.logger.log(`Auto-created Aisle '${obj.code}' under zone ${parentZoneId}`);
      }
      return { ...obj, aisleRef: aisle.id as string };
    }

    if (obj.type === 'bin') {
      if (obj.binRef) return obj; // already linked

      // Resolve parent aisle entity
      const parentAisleId = await this.resolveParentAisleId(warehouseId, obj, alreadySaved);
      if (!parentAisleId) {
        this.logger.warn(`Cannot auto-create Bin '${obj.code}': no parent aisle resolved`);
        return obj;
      }

      // Upsert Bin by (aisleId, code)
      let bin = await this.binRepository.findByCode(parentAisleId, obj.code);
      if (!bin) {
        bin = await this.binRepository.create(parentAisleId, {
          code: obj.code,
          capacityQty: obj.capacityQty,
          barcode: obj.barcode,
          isBlocked: obj.isBlocked,
          allowedSkuTags: obj.allowedSkuTags,
        });
        this.logger.log(`Auto-created Bin '${obj.code}' under aisle ${parentAisleId}`);
      }
      return { ...obj, binRef: bin.id as string };
    }

    return obj;
  }

  /** Resolve the Zone entity ID for a given aisle layout object. */
  private async resolveParentZoneId(
    warehouseId: string,
    obj: CreateLayoutObjectDto & { id?: string },
    alreadySaved: LayoutObjectDocument[],
  ): Promise<string | null> {
    // 1. Parent layout object already saved in this batch → check its zoneRef
    if (obj.parentId) {
      const parentInBatch = alreadySaved.find((s) => s.id === obj.parentId);
      if (parentInBatch?.zoneRef) return parentInBatch.zoneRef.toString();

      // 2. Parent layout object exists in DB → get its zoneRef
      const parentInDb = await this.layoutRepository.findObjectById(obj.parentId);
      if (parentInDb?.zoneRef) return parentInDb.zoneRef.toString();
    }

    // 3. No parent → cannot safely determine the zone; caller will skip auto-create
    return null;
  }

  /** Resolve the Aisle entity ID for a given bin layout object. */
  private async resolveParentAisleId(
    warehouseId: string,
    obj: CreateLayoutObjectDto & { id?: string },
    alreadySaved: LayoutObjectDocument[],
  ): Promise<string | null> {
    if (obj.parentId) {
      const parentInBatch = alreadySaved.find((s) => s.id === obj.parentId);
      if (parentInBatch?.aisleRef) return parentInBatch.aisleRef.toString();

      const parentInDb = await this.layoutRepository.findObjectById(obj.parentId);
      if (parentInDb?.aisleRef) return parentInDb.aisleRef.toString();
    }

    // No parent → cannot safely determine the aisle; caller will skip auto-create
    return null;
  }
}
