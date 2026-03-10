import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import { ZoneRepository } from '../repositories/zone.repository';
import { AisleRepository } from '../repositories/aisle.repository';
import { BinRepository } from '../repositories/bin.repository';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  QueryWarehouseDto,
} from '../dto/warehouse.dto';
import { WarehouseDocument } from '@shared/schemas';
import { WarehouseType } from '@shared/constants/warehouse.constants';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(
    private readonly warehouseRepository: WarehouseRepository,
    private readonly zoneRepository: ZoneRepository,
    private readonly aisleRepository: AisleRepository,
    private readonly binRepository: BinRepository,
  ) {}

  /**
   * Create a new warehouse.
   * `code` and `type` are optional – they will be auto-generated / defaulted when omitted.
   * `province` / `ward` / `addressDetail` are also optional for quick-create flows.
   */
  async create(
    createDto: CreateWarehouseDto,
    userId: string,
  ): Promise<WarehouseDocument> {
    // Auto-generate code when not supplied
    if (!createDto.code) {
      createDto.code = await this.generateUniqueCode(
        createDto.name,
        createDto.tenantId,
      );
    }

    // Default type when not supplied
    if (!createDto.type) {
      createDto.type = WarehouseType.GENERAL;
    }

    this.logger.log(`Creating warehouse: ${createDto.code}`);

    // Validate province and ward only when provided
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

    if (createDto.ward?.code && createDto.province?.code) {
      // Populate provinceCode/districtCode snapshot
      createDto.ward = {
        ...createDto.ward,
        ...(await this.resolveWardSnapshot(
          createDto.ward.code,
          createDto.province.code,
        )),
      };
    }

    // Check if warehouse code already exists
    const existingWarehouse = await this.warehouseRepository.findByCode(
      createDto.code,
      createDto.tenantId,
    );
    if (existingWarehouse) {
      throw new ConflictException(
        `Warehouse with code ${createDto.code} already exists`,
      );
    }

    // Validate temperature range
    if (
      createDto.temperatureMin !== undefined &&
      createDto.temperatureMax !== undefined &&
      createDto.temperatureMin > createDto.temperatureMax
    ) {
      throw new BadRequestException(
        'Temperature minimum cannot be greater than maximum',
      );
    }

    // Validate humidity range
    if (
      createDto.humidityMin !== undefined &&
      createDto.humidityMax !== undefined &&
      createDto.humidityMin > createDto.humidityMax
    ) {
      throw new BadRequestException(
        'Humidity minimum cannot be greater than maximum',
      );
    }

    // Validate usable area is not greater than total area
    if (
      createDto.usableAreaM2 !== undefined &&
      createDto.totalAreaM2 !== undefined &&
      createDto.usableAreaM2 > createDto.totalAreaM2
    ) {
      throw new BadRequestException(
        'Usable area cannot be greater than total area',
      );
    }

    // Validate location coordinates if provided
    if (createDto.location) {
      const [lon, lat] = createDto.location.coordinates;
      if (lon < -180 || lon > 180) {
        throw new BadRequestException('Longitude must be between -180 and 180');
      }
      if (lat < -90 || lat > 90) {
        throw new BadRequestException('Latitude must be between -90 and 90');
      }
    }

    try {
      const warehouse = await this.warehouseRepository.create(
        createDto,
        userId,
      );
      this.logger.log(
        `Created warehouse: ${warehouse._id} (${warehouse.code})`,
      );
      return warehouse;
    } catch (error: any) {
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        this.logger.warn(`Duplicate warehouse code: ${createDto.code}`);
        throw new ConflictException(
          `Warehouse with code ${createDto.code} already exists`,
        );
      }
      this.logger.error(
        `Failed to create warehouse: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all warehouses with filtering and pagination
   */
  async findAll(query: QueryWarehouseDto): Promise<{
    items: WarehouseDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.warehouseRepository.findAll(query);
  }

  /**
   * Find warehouse by ID
   */
  async findById(id: string): Promise<WarehouseDocument> {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  /**
   * Find warehouse by code
   */
  async findByCode(
    code: string,
    tenantId?: string,
  ): Promise<WarehouseDocument> {
    const warehouse = await this.warehouseRepository.findByCode(code, tenantId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with code ${code} not found`);
    }
    return warehouse;
  }

  /**
   * Update warehouse
   */
  async update(
    id: string,
    updateDto: UpdateWarehouseDto,
    userId: string,
  ): Promise<WarehouseDocument> {
    this.logger.log(`Updating warehouse: ${id}`);
    // Check if warehouse exists
    const existingWarehouse = await this.warehouseRepository.findById(id);
    if (!existingWarehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    // Validate province if provided
    if (updateDto.province) {
      const provinceExists = await this.warehouseRepository.provinceExists(
        updateDto.province.code,
      );
      if (!provinceExists) {
        throw new BadRequestException(
          `Province with code ${updateDto.province.code} does not exist`,
        );
      }
    }

    // Validate ward if provided; populate provinceCode/districtCode
    if (updateDto.ward && updateDto.province) {
      updateDto.ward = {
        ...updateDto.ward,
        ...(await this.resolveWardSnapshot(
          updateDto.ward.code,
          updateDto.province.code,
        )),
      };
    }

    // Check for code uniqueness if code is being updated
    if (updateDto.code && updateDto.code !== existingWarehouse.code) {
      const codeExists = await this.warehouseRepository.findByCode(
        updateDto.code,
        updateDto.tenantId || existingWarehouse.tenantId,
      );
      if (codeExists) {
        throw new ConflictException(
          `Warehouse with code ${updateDto.code} already exists`,
        );
      }
    }

    // Validate ranges
    const finalTempMin =
      updateDto.temperatureMin ?? existingWarehouse.temperatureMin;
    const finalTempMax =
      updateDto.temperatureMax ?? existingWarehouse.temperatureMax;
    if (
      finalTempMin !== undefined &&
      finalTempMax !== undefined &&
      finalTempMin > finalTempMax
    ) {
      throw new BadRequestException(
        'Temperature minimum cannot be greater than maximum',
      );
    }

    const finalHumidityMin =
      updateDto.humidityMin ?? existingWarehouse.humidityMin;
    const finalHumidityMax =
      updateDto.humidityMax ?? existingWarehouse.humidityMax;
    if (
      finalHumidityMin !== undefined &&
      finalHumidityMax !== undefined &&
      finalHumidityMin > finalHumidityMax
    ) {
      throw new BadRequestException(
        'Humidity minimum cannot be greater than maximum',
      );
    }

    const finalUsableArea =
      updateDto.usableAreaM2 ?? existingWarehouse.usableAreaM2;
    const finalTotalArea =
      updateDto.totalAreaM2 ?? existingWarehouse.totalAreaM2;
    if (
      finalUsableArea !== undefined &&
      finalTotalArea !== undefined &&
      finalUsableArea > finalTotalArea
    ) {
      throw new BadRequestException(
        'Usable area cannot be greater than total area',
      );
    }

    // Validate location coordinates if provided
    if (updateDto.location) {
      const [lon, lat] = updateDto.location.coordinates;
      if (lon < -180 || lon > 180) {
        throw new BadRequestException('Longitude must be between -180 and 180');
      }
      if (lat < -90 || lat > 90) {
        throw new BadRequestException('Latitude must be between -90 and 90');
      }
    }

    try {
      const updated = await this.warehouseRepository.update(
        id,
        updateDto,
        userId,
      );
      if (!updated) {
        throw new NotFoundException(`Warehouse with ID ${id} not found`);
      }
      this.logger.log(`Updated warehouse: ${id}`);
      return updated;
    } catch (error: any) {
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate warehouse code on update: ${updateDto.code}`,
        );
        throw new ConflictException(
          `Warehouse with code ${updateDto.code} already exists`,
        );
      }
      throw error;
    }
  }

  /**
   * Soft delete warehouse
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting warehouse: ${id}`);
    const warehouse = await this.warehouseRepository.softDelete(id);
    if (!warehouse) {
      this.logger.warn(`Warehouse not found for deletion: ${id}`);
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    this.logger.log(`Deleted warehouse: ${id}`);
  }

  /**
   * Restore soft-deleted warehouse
   */
  async restore(id: string): Promise<WarehouseDocument> {
    const warehouse = await this.warehouseRepository.restore(id);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  /**
   * Get all provinces
   */
  async getProvinces() {
    return this.warehouseRepository.getAllProvinces();
  }

  /**
   * Get wards by province
   */
  async getWardsByProvince(provinceCode: string) {
    return this.warehouseRepository.getWardsByProvince(provinceCode);
  }

  /**
   * Find warehouses nearby
   */
  async findNearby(
    longitude: number,
    latitude: number,
    radiusKm: number,
    limit: number = 10,
  ) {
    // Validate coordinates
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }
    if (radiusKm <= 0) {
      throw new BadRequestException('Radius must be greater than 0');
    }

    return this.warehouseRepository.findNearby(
      longitude,
      latitude,
      radiusKm,
      limit,
    );
  }

  /**
   * Get full warehouse structure tree (Warehouse → Zones → Aisles → Bins)
   */
  async getStructure(warehouseId: string): Promise<any> {
    const warehouse = await this.warehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    const { items: zones } = await this.zoneRepository.findAll(warehouseId, {
      limit: 500,
    });

    const structure = await Promise.all(
      zones.map(async (zone) => {
        const aisles = await this.aisleRepository.findByZoneId(
          zone._id.toString(),
        );
        const aislesWithBins = await Promise.all(
          aisles.map(async (aisle) => {
            const bins = await this.binRepository.findByAisleId(
              aisle._id.toString(),
            );
            return {
              ...aisle.toJSON(),
              bins: bins.map((b) => b.toJSON()),
            };
          }),
        );
        return {
          ...zone.toJSON(),
          aisles: aislesWithBins,
        };
      }),
    );

    return {
      ...warehouse.toJSON(),
      zones: structure,
    };
  }

  /**
   * Validate that a ward exists in a province and return it enriched with provinceCode/districtCode.
   * Throws BadRequestException if the ward is not found.
   */
  private async resolveWardSnapshot(
    wardCode: string,
    provinceCode: string,
  ): Promise<{
    code: string;
    name: string;
    provinceCode: string;
    districtCode?: string;
  }> {
    const wardDoc = await this.warehouseRepository.getWard(
      wardCode,
      provinceCode,
    );
    if (!wardDoc) {
      throw new BadRequestException(
        `Ward with code ${wardCode} does not exist in province ${provinceCode}`,
      );
    }
    return {
      code: wardDoc.code,
      name: wardDoc.name,
      provinceCode: wardDoc.provinceCode,
      districtCode: wardDoc.districtCode,
    };
  }

  /**
   * Auto-generate a unique warehouse code scoped to the tenant.
   * Pattern: WH-<SLUG>-<TIMESTAMP_SUFFIX>
   */
  private async generateUniqueCode(
    name: string,
    tenantId?: string,
  ): Promise<string> {
    const slug = name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 12);

    let suffix = Date.now().toString().slice(-6);
    let candidate = `WH-${slug}-${suffix}`;
    let attempt = 0;
    while (
      (await this.warehouseRepository.findByCode(candidate, tenantId)) &&
      attempt < 10
    ) {
      suffix = Date.now().toString().slice(-6);
      candidate = `WH-${slug}-${suffix}`;
      attempt++;
    }
    return candidate;
  }
}
