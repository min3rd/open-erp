import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ShipmentRepository } from '../../repositories/wms/shipment.repository';
import { WmsPackageRepository } from '../../repositories/wms/package.repository';
import {
  CreateShipmentDto,
  ShipShipmentDto,
} from '../../dto/wms/shipment.dto';
import {
  ShipmentStatus,
  WmsPackageStatus,
} from '@shared/schemas';

@Injectable()
export class ShipmentService {
  private readonly logger = new Logger(ShipmentService.name);

  constructor(
    private readonly shipmentRepository: ShipmentRepository,
    private readonly packageRepository: WmsPackageRepository,
  ) {}

  async create(dto: CreateShipmentDto, userId?: string) {
    this.logger.log(`Creating shipment for org: ${dto.orgId}`);

    const data: any = {
      orgId: new Types.ObjectId(dto.orgId),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      status: ShipmentStatus.PENDING,
      orderIds: dto.orderIds || [],
      packageIds: (dto.packageIds || []).map((id) => new Types.ObjectId(id)),
    };

    if (dto.carrier) data.carrier = dto.carrier;
    if (dto.trackingNumber) data.trackingNumber = dto.trackingNumber;
    if (dto.recipientName) data.recipientName = dto.recipientName;
    if (dto.recipientAddress) data.recipientAddress = dto.recipientAddress;
    if (dto.notes) data.notes = dto.notes;
    if (userId) data.createdBy = new Types.ObjectId(userId);

    return this.shipmentRepository.create(data);
  }

  async findById(id: string) {
    const shipment = await this.shipmentRepository.findById(id);
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment;
  }

  async findAll(
    filter: {
      orgId?: string;
      warehouseId?: string;
      status?: ShipmentStatus;
      q?: string;
    } = {},
    options: { page?: number; limit?: number; sortField?: string; sortOrder?: 1 | -1 } = {},
  ) {
    const { page = 1, limit = 20, sortField, sortOrder } = options;
    const skip = (page - 1) * limit;

    const result = await this.shipmentRepository.findAll(filter, { skip, limit, sortField, sortOrder });

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async ship(id: string, dto: ShipShipmentDto, userId?: string) {
    const shipment = await this.findById(id);

    if (
      shipment.status === ShipmentStatus.DELIVERED ||
      shipment.status === ShipmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot ship a shipment in status: ${shipment.status}`,
      );
    }

    const updateData: any = {
      status: dto.partial ? ShipmentStatus.PARTIAL : ShipmentStatus.SHIPPED,
      shippedAt: new Date(),
    };

    if (dto.trackingNumber) updateData.trackingNumber = dto.trackingNumber;
    if (dto.carrier) updateData.carrier = dto.carrier;
    if (userId) updateData.shippedBy = new Types.ObjectId(userId);

    if (dto.packageIds?.length) {
      const existingIds = shipment.packageIds.map((p) => p.toString());
      const newIds = [...new Set([...existingIds, ...dto.packageIds])];
      updateData.packageIds = newIds.map((pid) => new Types.ObjectId(pid));
    }

    // Mark packages as shipped
    const packageIdsToShip = dto.packageIds?.length
      ? dto.packageIds
      : shipment.packageIds.map((p) => p.toString());

    for (const pkgId of packageIdsToShip) {
      await this.packageRepository.update(pkgId, {
        status: WmsPackageStatus.SHIPPED,
      } as any);
    }

    return this.shipmentRepository.update(id, updateData);
  }

  async markDelivered(id: string) {
    const shipment = await this.findById(id);

    if (
      shipment.status !== ShipmentStatus.SHIPPED &&
      shipment.status !== ShipmentStatus.IN_TRANSIT &&
      shipment.status !== ShipmentStatus.PARTIAL
    ) {
      throw new BadRequestException(
        `Cannot mark as delivered a shipment in status: ${shipment.status}`,
      );
    }

    return this.shipmentRepository.update(id, {
      status: ShipmentStatus.DELIVERED,
      deliveredAt: new Date(),
    } as any);
  }
}

