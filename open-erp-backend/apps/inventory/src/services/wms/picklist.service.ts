import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { PicklistRepository } from '../../repositories/wms/picklist.repository';
import { WmsPackageRepository } from '../../repositories/wms/package.repository';
import {
  CreatePicklistDto,
  PickDto,
  CreatePackageDto,
} from '../../dto/wms/picklist.dto';
import {
  PicklistStatus,
  PicklistLine,
  WmsPackageStatus,
} from '@shared/schemas';

@Injectable()
export class PicklistService {
  private readonly logger = new Logger(PicklistService.name);

  constructor(
    private readonly picklistRepository: PicklistRepository,
    private readonly packageRepository: WmsPackageRepository,
  ) {}

  async createPicklist(dto: CreatePicklistDto, userId?: string) {
    this.logger.log(`Creating picklist for org: ${dto.orgId}`);

    const data: any = {
      orgId: new Types.ObjectId(dto.orgId),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      status: PicklistStatus.DRAFT,
      orderIds: dto.orderIds || [],
    };

    if (dto.notes) data.notes = dto.notes;
    if (dto.assignedTo) {
      data.assignedTo = new Types.ObjectId(dto.assignedTo);
      data.status = PicklistStatus.ASSIGNED;
    }
    if (userId) data.createdBy = new Types.ObjectId(userId);

    if (dto.lines?.length) {
      data.lines = dto.lines.map((line) => ({
        skuId: new Types.ObjectId(line.skuId),
        skuCode: line.skuCode,
        skuName: line.skuName,
        qty: line.qty,
        pickedQty: 0,
        unit: line.unit,
        bins: [],
        serials: [],
      }));
    }

    return this.picklistRepository.create(data);
  }

  async findById(id: string) {
    const picklist = await this.picklistRepository.findById(id);
    if (!picklist) {
      throw new NotFoundException('Picklist not found');
    }
    return picklist;
  }

  async findAll(
    filter: {
      orgId?: string;
      warehouseId?: string;
      status?: PicklistStatus;
    } = {},
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const result = await this.picklistRepository.findAll(filter, { skip, limit });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async pick(id: string, dto: PickDto, userId?: string) {
    const picklist = await this.findById(id);

    if (
      picklist.status === PicklistStatus.COMPLETED ||
      picklist.status === PicklistStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot pick a picklist in status: ${picklist.status}`,
      );
    }

    const updatedLines = [...picklist.lines] as PicklistLine[];

    for (const pickItem of dto.picks) {
      const lineIndex = updatedLines.findIndex(
        (l) => l.skuId.toString() === pickItem.skuId,
      );

      if (lineIndex === -1) {
        this.logger.warn(`Line not found for SKU: ${pickItem.skuId}`);
        continue;
      }

      const line = updatedLines[lineIndex];
      line.pickedQty = (line.pickedQty || 0) + pickItem.pickedQty;

      if (pickItem.bins?.length) {
        line.bins = [...(line.bins || []), ...pickItem.bins];
      }
      if (pickItem.serials?.length) {
        line.serials = [...(line.serials || []), ...pickItem.serials];
      }
      if (pickItem.lotId) {
        line.lotId = new Types.ObjectId(pickItem.lotId) as any;
      }
    }

    const allPicked = updatedLines.every((l) => l.pickedQty >= l.qty);
    const anyPicked = updatedLines.some((l) => l.pickedQty > 0);
    const newStatus = allPicked
      ? PicklistStatus.COMPLETED
      : anyPicked
        ? PicklistStatus.PARTIAL
        : PicklistStatus.IN_PROGRESS;

    const updateData: any = {
      lines: updatedLines,
      status: newStatus,
    };

    if (newStatus === PicklistStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.picklistRepository.update(id, updateData);
  }

  async createPackage(dto: CreatePackageDto, userId?: string) {
    this.logger.log(`Creating package for org: ${dto.orgId}`);

    const data: any = {
      orgId: new Types.ObjectId(dto.orgId),
      status: WmsPackageStatus.PACKED,
      picklistIds: dto.picklistIds || [],
    };

    if (dto.shipmentId) data.shipmentId = new Types.ObjectId(dto.shipmentId);
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.dimensions) data.dimensions = dto.dimensions;
    if (dto.notes) data.notes = dto.notes;
    if (userId) data.createdBy = new Types.ObjectId(userId);

    const pkg = await this.packageRepository.create(data);

    // Mark associated picklists as completed if not already
    for (const picklistId of dto.picklistIds || []) {
      const pl = await this.picklistRepository.findById(picklistId);
      if (pl && pl.status !== PicklistStatus.COMPLETED) {
        await this.picklistRepository.update(picklistId, {
          status: PicklistStatus.COMPLETED,
          completedAt: new Date(),
        } as any);
      }
    }

    return pkg;
  }

  async findPackageById(id: string) {
    const pkg = await this.packageRepository.findById(id);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    return pkg;
  }

  async findPackages(
    filter: {
      orgId?: string;
      shipmentId?: string;
      status?: WmsPackageStatus;
    } = {},
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const result = await this.packageRepository.findAll(filter, { skip, limit });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }
}

