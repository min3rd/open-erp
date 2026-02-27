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
import { WarehouseLayoutDocument, LayoutObjectDocument, LayoutPosition } from '@shared/schemas';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { ZoneDocument, AisleDocument, BinDocument } from '@shared/schemas';

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
    objects: any[];
  }> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    const layout = await this.layoutRepository.findLayoutByWarehouse(warehouseId);

    // Fetch all zone/aisle/bin entities
    const zones = await this.zoneRepository.findAllByWarehouse(warehouseId);
    const zoneIds = zones.map((z) => z.id as string);
    const aisles = zoneIds.length > 0 ? await this.aisleRepository.findAllByZoneIds(zoneIds) : [];
    const aisleIds = aisles.map((a) => a.id as string);
    const bins = aisleIds.length > 0 ? await this.binRepository.findAllByAisleIds(aisleIds) : [];

    // Map zone → aisles, aisle → bins for fast lookup
    const zoneAisleMap = new Map<string, AisleDocument[]>();
    for (const aisle of aisles) {
      const zId = aisle.zoneId.toString();
      if (!zoneAisleMap.has(zId)) zoneAisleMap.set(zId, []);
      zoneAisleMap.get(zId)!.push(aisle);
    }
    const aisleBinMap = new Map<string, BinDocument[]>();
    for (const bin of bins) {
      const aId = bin.aisleId.toString();
      if (!aisleBinMap.has(aId)) aisleBinMap.set(aId, []);
      aisleBinMap.get(aId)!.push(bin);
    }

    // Convert entities to LayoutObject-compatible shape
    const objects: any[] = [];
    for (const zone of zones) {
      objects.push(this.zoneToObject(zone, warehouseId));
      for (const aisle of zoneAisleMap.get(zone.id) ?? []) {
        objects.push(this.aisleToObject(aisle, warehouseId, zone.id));
        for (const bin of aisleBinMap.get(aisle.id) ?? []) {
          objects.push(this.binToObject(bin, warehouseId, aisle.id));
        }
      }
    }

    // Append label/corridor from layout_objects collection
    const labelCorridors = await this.layoutRepository.findLabelCorridorObjects(warehouseId);
    for (const lc of labelCorridors) {
      objects.push(lc);
    }

    // Sort by zOrder ascending
    objects.sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0));

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
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    return this.layoutRepository.findObjects(warehouseId, query);
  }

  async getObjectById(id: string): Promise<any> {
    // Try zone/aisle/bin first, then layout_objects
    const zone = await this.zoneRepository.findById(id);
    if (zone) return this.zoneToObject(zone, zone.warehouseId.toString());

    const aisle = await this.aisleRepository.findById(id);
    if (aisle) return this.aisleToObject(aisle, '', aisle.zoneId.toString());

    const bin = await this.binRepository.findById(id);
    if (bin) return this.binToObject(bin, '', bin.aisleId.toString());

    const obj = await this.layoutRepository.findObjectById(id);
    if (!obj) throw new NotFoundException(`Layout object ${id} not found`);
    return obj;
  }

  async createObject(
    warehouseId: string,
    dto: CreateLayoutObjectDto,
  ): Promise<LayoutObjectDocument> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);

    if (dto.parentId) {
      const parent = await this.layoutRepository.findObjectById(dto.parentId);
      if (!parent) throw new NotFoundException(`Parent layout object ${dto.parentId} not found`);
    }

    const existing = await this.layoutRepository.findObjectByCode(warehouseId, dto.code);
    if (existing) {
      throw new ConflictException(
        `Layout object with code ${dto.code} already exists in this warehouse`,
      );
    }

    this.logger.log(`Creating ${dto.type} layout object '${dto.code}' in warehouse ${warehouseId}`);
    return this.layoutRepository.createObject(warehouseId, dto);
  }

  async updateObject(id: string, dto: UpdateLayoutObjectDto): Promise<any> {
    // Try to find in zone/aisle/bin first
    const zone = await this.zoneRepository.findById(id);
    if (zone) {
      const layout = this.buildLayoutFromDto(dto);
      return this.zoneRepository.updateLayout(id, dto.name || zone.name, layout);
    }
    const aisle = await this.aisleRepository.findById(id);
    if (aisle) {
      const layout = this.buildLayoutFromDto(dto);
      return this.aisleRepository.updateLayout(id, dto.name || aisle.name, layout);
    }
    const bin = await this.binRepository.findById(id);
    if (bin) {
      const layout = this.buildLayoutFromDto(dto);
      return this.binRepository.updateLayout(id, dto.name || bin.code, layout);
    }

    // Fall back to layout_objects (label/corridor)
    const existing = await this.layoutRepository.findObjectById(id);
    if (!existing) throw new NotFoundException(`Layout object ${id} not found`);
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
    // Try zone collection — just clear layout (don't delete the entity)
    const zone = await this.zoneRepository.findById(id);
    if (zone) {
      await this.zoneRepository.clearLayout(id);
      this.logger.log(`Cleared layout for zone ${id}`);
      return;
    }

    const aisle = await this.aisleRepository.findById(id);
    if (aisle) {
      await this.aisleRepository.clearLayout(id);
      this.logger.log(`Cleared layout for aisle ${id}`);
      return;
    }

    const bin = await this.binRepository.findById(id);
    if (bin) {
      await this.binRepository.clearLayout(id);
      this.logger.log(`Cleared layout for bin ${id}`);
      return;
    }

    // Must be label/corridor in layout_objects
    const existing = await this.layoutRepository.findObjectById(id);
    if (!existing) throw new NotFoundException(`Layout object ${id} not found`);

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
  ): Promise<any[]> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);

    // Sort by type priority: zones → aisles → bins → labels/corridors
    const TYPE_ORDER: Record<string, number> = { zone: 0, aisle: 1, bin: 2, label: 3, corridor: 4 };
    const sorted = [...objects].sort(
      (a, b) => (TYPE_ORDER[a.type] ?? 5) - (TYPE_ORDER[b.type] ?? 5),
    );

    // Map from original request ID (may be tmp-xxx) to saved entity ID
    const idMap = new Map<string, string>();
    const results: any[] = [];

    for (const obj of sorted) {
      const layout: Partial<LayoutPosition> = {
        x: obj.x ?? 0,
        y: obj.y ?? 0,
        widthM: obj.widthM,
        heightM: obj.heightM,
        rotationDeg: obj.rotationDeg ?? 0,
        zOrder: obj.zOrder ?? 0,
      };

      if (obj.type === 'zone') {
        let zone: ZoneDocument | null = null;
        if (obj.id && !obj.id.startsWith('tmp-')) {
          zone = await this.zoneRepository.findById(obj.id);
          if (zone) {
            zone = await this.zoneRepository.updateLayout(obj.id, obj.name, layout);
          }
        }
        if (!zone) {
          zone = await this.zoneRepository.upsertByCode(warehouseId, obj.code, obj.name, layout);
        }
        if (obj.id) idMap.set(obj.id, zone!.id);
        results.push(this.zoneToObject(zone!, warehouseId));
      } else if (obj.type === 'aisle') {
        // Resolve zone ID from parentId (support tmp-ids via idMap)
        const rawParent = obj.parentId;
        const zoneId = rawParent ? (idMap.get(rawParent) ?? rawParent) : null;
        if (!zoneId) {
          this.logger.warn(`Skipping aisle '${obj.code}': cannot resolve parent zone`);
          continue;
        }
        let aisle: AisleDocument | null = null;
        if (obj.id && !obj.id.startsWith('tmp-')) {
          aisle = await this.aisleRepository.findById(obj.id);
          if (aisle) {
            aisle = await this.aisleRepository.updateLayout(obj.id, obj.name, layout);
          }
        }
        if (!aisle) {
          aisle = await this.aisleRepository.upsertByZoneAndCode(zoneId, obj.code, obj.name, layout);
        }
        if (obj.id) idMap.set(obj.id, aisle!.id);
        results.push(this.aisleToObject(aisle!, warehouseId, zoneId));
      } else if (obj.type === 'bin') {
        const rawParent = obj.parentId;
        const aisleId = rawParent ? (idMap.get(rawParent) ?? rawParent) : null;
        if (!aisleId) {
          this.logger.warn(`Skipping bin '${obj.code}': cannot resolve parent aisle`);
          continue;
        }
        let bin: BinDocument | null = null;
        if (obj.id && !obj.id.startsWith('tmp-')) {
          bin = await this.binRepository.findById(obj.id);
          if (bin) {
            bin = await this.binRepository.updateLayout(obj.id, obj.name, layout);
          }
        }
        if (!bin) {
          bin = await this.binRepository.upsertByAisleAndCode(aisleId, obj.code, obj.name, layout, {
            barcode: obj.barcode,
            capacityQty: obj.capacityQty,
            isBlocked: obj.isBlocked,
            allowedSkuTags: obj.allowedSkuTags,
          });
        }
        if (obj.id) idMap.set(obj.id, bin!.id);
        results.push(this.binToObject(bin!, warehouseId, aisleId));
      } else {
        // label/corridor — use layout_objects collection
        const saved = await this.layoutRepository.upsertObject(warehouseId, obj);
        if (obj.id) idMap.set(obj.id, saved.id);
        results.push(saved);
      }
    }

    return results;
  }

  // ─── Private converters ────────────────────────────────────────────────────

  private zoneToObject(zone: ZoneDocument, warehouseId: string): any {
    return {
      id: zone.id,
      warehouseId,
      type: 'zone',
      code: zone.code,
      name: zone.name,
      parentId: null,
      x: zone.layout?.x ?? 0,
      y: zone.layout?.y ?? 0,
      widthM: zone.layout?.widthM ?? 10,
      heightM: zone.layout?.heightM ?? 8,
      rotationDeg: zone.layout?.rotationDeg ?? 0,
      zOrder: zone.layout?.zOrder ?? 0,
      isBlocked: false,
      capacityQty: 0,
      zoneRef: zone.id,
      aisleRef: null,
      binRef: null,
      createdAt: (zone as any).createdAt,
      updatedAt: (zone as any).updatedAt,
    };
  }

  private aisleToObject(aisle: AisleDocument, warehouseId: string, zoneId: string): any {
    return {
      id: aisle.id,
      warehouseId,
      type: 'aisle',
      code: aisle.code,
      name: aisle.name,
      parentId: zoneId,
      x: aisle.layout?.x ?? 0,
      y: aisle.layout?.y ?? 0,
      widthM: aisle.layout?.widthM ?? 5,
      heightM: aisle.layout?.heightM ?? 4,
      rotationDeg: aisle.layout?.rotationDeg ?? 0,
      zOrder: aisle.layout?.zOrder ?? 2,
      isBlocked: false,
      capacityQty: 0,
      zoneRef: zoneId,
      aisleRef: aisle.id,
      binRef: null,
      createdAt: (aisle as any).createdAt,
      updatedAt: (aisle as any).updatedAt,
    };
  }

  private binToObject(bin: BinDocument, warehouseId: string, aisleId: string): any {
    return {
      id: bin.id,
      warehouseId,
      type: 'bin',
      code: bin.code,
      name: bin.code,
      parentId: aisleId,
      x: bin.layout?.x ?? 0,
      y: bin.layout?.y ?? 0,
      widthM: bin.layout?.widthM ?? 2,
      heightM: bin.layout?.heightM ?? 1.5,
      rotationDeg: bin.layout?.rotationDeg ?? 0,
      zOrder: bin.layout?.zOrder ?? 4,
      isBlocked: bin.isBlocked ?? false,
      capacityQty: bin.capacityQty ?? 0,
      capacityVolume: bin.capacityVolume,
      allowedSkuTags: bin.allowedSkuTags,
      barcode: bin.barcode,
      zoneRef: null,
      aisleRef: aisleId,
      binRef: bin.id,
      createdAt: (bin as any).createdAt,
      updatedAt: (bin as any).updatedAt,
    };
  }

  private buildLayoutFromDto(dto: UpdateLayoutObjectDto): Partial<LayoutPosition> {
    return {
      x: dto.x ?? undefined,
      y: dto.y ?? undefined,
      widthM: dto.widthM ?? undefined,
      heightM: dto.heightM ?? undefined,
      rotationDeg: dto.rotationDeg ?? undefined,
      zOrder: dto.zOrder ?? undefined,
    };
  }
}
