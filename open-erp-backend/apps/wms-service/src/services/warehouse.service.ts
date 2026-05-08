import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { WmsWarehouseRepository } from '../repositories/warehouse.repository';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  QueryWarehouseDto,
} from '../dto/warehouse.dto';
import { WarehouseDocument } from '@shared/schemas';
import { WarehouseType } from '@shared/constants/warehouse.constants';

@Injectable()
export class WmsWarehouseService {
  private readonly logger = new Logger(WmsWarehouseService.name);

  constructor(
    private readonly warehouseRepository: WmsWarehouseRepository,
  ) {}

  async create(
    createDto: CreateWarehouseDto,
    userId: string,
    tenantId: string,
  ): Promise<WarehouseDocument> {
    const resolvedCode = createDto.code
      ? createDto.code
      : await this.generateUniqueCode(createDto.name, tenantId);

    const resolvedType = createDto.type ?? WarehouseType.GENERAL;

    this.logger.log(`Creating warehouse: ${resolvedCode} for tenant: ${tenantId}`);

    if (createDto.province?.code) {
      const provinceExists = await this.warehouseRepository.provinceExists(
        createDto.province.code,
      );
      if (!provinceExists) {
        throw new BadRequestException(
          `Province with code ${createDto.province.code} does not exist`,
        );
      }
    }

    let resolvedWard = createDto.ward;
    if (createDto.ward?.code && createDto.province?.code) {
      const wardDoc = await this.warehouseRepository.getWard(
        createDto.ward.code,
        createDto.province.code,
      );
      if (wardDoc) {
        resolvedWard = {
          ...createDto.ward,
          provinceCode: wardDoc.provinceCode,
        };
      }
    }

    const existingWarehouse = await this.warehouseRepository.findByCode(
      resolvedCode,
      tenantId,
    );
    if (existingWarehouse) {
      throw new ConflictException(
        `Warehouse with code ${resolvedCode} already exists`,
      );
    }

    if (
      createDto.temperatureMin !== undefined &&
      createDto.temperatureMax !== undefined &&
      createDto.temperatureMin > createDto.temperatureMax
    ) {
      throw new BadRequestException('Temperature minimum cannot be greater than maximum');
    }

    if (
      createDto.humidityMin !== undefined &&
      createDto.humidityMax !== undefined &&
      createDto.humidityMin > createDto.humidityMax
    ) {
      throw new BadRequestException('Humidity minimum cannot be greater than maximum');
    }

    if (
      createDto.usableAreaM2 !== undefined &&
      createDto.totalAreaM2 !== undefined &&
      createDto.usableAreaM2 > createDto.totalAreaM2
    ) {
      throw new BadRequestException('Usable area cannot be greater than total area');
    }

    if (createDto.location) {
      const [lon, lat] = createDto.location.coordinates;
      if (lon < -180 || lon > 180) {
        throw new BadRequestException('Longitude must be between -180 and 180');
      }
      if (lat < -90 || lat > 90) {
        throw new BadRequestException('Latitude must be between -90 and 90');
      }
    }

    const resolvedDto: CreateWarehouseDto = {
      ...createDto,
      code: resolvedCode,
      type: resolvedType,
      tenantId,
      ...(resolvedWard ? { ward: resolvedWard } : {}),
    };

    try {
      const warehouse = await this.warehouseRepository.create(resolvedDto, userId);
      this.logger.log(`Created warehouse: ${warehouse._id} (${warehouse.code})`);
      return warehouse;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Warehouse with code ${resolvedCode} already exists`);
      }
      throw error;
    }
  }

  async findAll(query: QueryWarehouseDto, tenantId: string) {
    return this.warehouseRepository.findAll({ ...query, tenantId });
  }

  async findById(id: string, tenantId: string): Promise<WarehouseDocument> {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    if (warehouse.tenantId && warehouse.tenantId !== tenantId) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  async update(
    id: string,
    updateDto: UpdateWarehouseDto,
    userId: string,
    tenantId: string,
  ): Promise<WarehouseDocument> {
    this.logger.log(`Updating warehouse: ${id}`);
    const existing = await this.warehouseRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    if (existing.tenantId && existing.tenantId !== tenantId) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    if (updateDto.province?.code) {
      const provinceExists = await this.warehouseRepository.provinceExists(updateDto.province.code);
      if (!provinceExists) {
        throw new BadRequestException(
          `Province with code ${updateDto.province.code} does not exist`,
        );
      }
    }

    if (updateDto.code && updateDto.code !== existing.code) {
      const codeExists = await this.warehouseRepository.findByCode(updateDto.code, tenantId);
      if (codeExists) {
        throw new ConflictException(`Warehouse with code ${updateDto.code} already exists`);
      }
    }

    try {
      const updated = await this.warehouseRepository.update(id, updateDto, userId);
      if (!updated) {
        throw new NotFoundException(`Warehouse with ID ${id} not found`);
      }
      return updated;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Warehouse with code ${updateDto.code} already exists`);
      }
      throw error;
    }
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const existing = await this.warehouseRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    if (existing.tenantId && existing.tenantId !== tenantId) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    const result = await this.warehouseRepository.softDelete(id);
    if (!result) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    this.logger.log(`Deleted warehouse: ${id}`);
  }

  async getProvinces() {
    return this.warehouseRepository.getAllProvinces();
  }

  async getWardsByProvince(provinceCode: string) {
    return this.warehouseRepository.getWardsByProvince(provinceCode);
  }

  private async generateUniqueCode(name: string, tenantId: string): Promise<string> {
    const prefix = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 4);
    const timestamp = Date.now().toString(36).toUpperCase();
    return `WH-${prefix}-${timestamp}`;
  }
}
