import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsEmail,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  WarehouseType,
  WarehouseStatus,
  CapacityUnit,
  SecurityLevel,
  WorkingShift,
  Region,
  PaymentTerm,
  Currency,
  SpecialCondition,
} from '@shared/constants/warehouse.constants';

export class ProvinceDto {
  @ApiProperty({ example: '01' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Hà Nội' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class WardDto {
  @ApiProperty({ example: '00001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Phúc Xá' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '01' })
  @IsOptional()
  @IsString()
  provinceCode?: string;

  @ApiPropertyOptional({ example: '001' })
  @IsOptional()
  @IsString()
  districtCode?: string;
}

export class LocationDto {
  @ApiProperty({ example: 'Point' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: [105.8342, 21.0285] })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];
}

export class ManagerDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CameraSystemDto {
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cameraCount?: number;

  @ApiPropertyOptional({ example: '100%' })
  @IsOptional()
  @IsString()
  coverage?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recordingDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isAIEnabled?: boolean;
}

export class AccessControlDto {
  @ApiPropertyOptional({ example: 'RFID' })
  @IsOptional()
  @IsString()
  system?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  biometric?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  cardAccess?: boolean;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityGuards?: number;
}

export class CreateWarehouseDto {
  @ApiPropertyOptional({ example: 'WH-001' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({ example: 'WH-HN-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ example: 'Kho Hà Nội 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ enum: WarehouseType, example: WarehouseType.GENERAL })
  @IsOptional()
  @IsEnum(WarehouseType)
  type?: WarehouseType;

  @ApiPropertyOptional({ enum: WarehouseStatus, example: WarehouseStatus.ACTIVE })
  @IsOptional()
  @IsEnum(WarehouseStatus)
  status?: WarehouseStatus;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'GPKD-001' })
  @IsOptional()
  @IsString()
  businessLicense?: string;

  @ApiPropertyOptional({ example: 'GPKHO-001' })
  @IsOptional()
  @IsString()
  warehouseLicense?: string;

  @ApiPropertyOptional({ example: 'HQ-001' })
  @IsOptional()
  @IsString()
  customsCode?: string;

  @ApiPropertyOptional({ example: '123 Đường ABC' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressDetail?: string;

  @ApiPropertyOptional({ type: WardDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WardDto)
  ward?: WardDto;

  @ApiPropertyOptional({ type: ProvinceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProvinceDto)
  province?: ProvinceDto;

  @ApiPropertyOptional({ enum: Region, example: Region.NORTHERN })
  @IsOptional()
  @IsEnum(Region)
  region?: Region;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAreaM2?: number;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usableAreaM2?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storageCapacity?: number;

  @ApiPropertyOptional({ enum: CapacityUnit, example: CapacityUnit.TON })
  @IsOptional()
  @IsEnum(CapacityUnit)
  capacityUnit?: CapacityUnit;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  zonesCount?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  racksCount?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  floorsCount?: number;

  @ApiPropertyOptional({ example: -20 })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  temperatureMin?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  temperatureMax?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humidityMin?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humidityMax?: number;

  @ApiPropertyOptional({ enum: SpecialCondition, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SpecialCondition, { each: true })
  specialConditions?: SpecialCondition[];

  @ApiPropertyOptional({ type: ManagerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ManagerDto)
  manager?: ManagerDto;

  @ApiPropertyOptional({ example: '+84901234567' })
  @IsOptional()
  @IsString()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'warehouse@example.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  workersCount?: number;

  @ApiPropertyOptional({ enum: WorkingShift, example: WorkingShift.FULL_TIME })
  @IsOptional()
  @IsEnum(WorkingShift)
  workingShift?: WorkingShift;

  @ApiPropertyOptional({ example: '08:00 - 17:00' })
  @IsOptional()
  @IsString()
  operatingHours?: string;

  @ApiPropertyOptional({ example: 'CERT-FIRE-001' })
  @IsOptional()
  @IsString()
  fireProtectionCert?: string;

  @ApiPropertyOptional({ enum: SecurityLevel, example: SecurityLevel.STANDARD })
  @IsOptional()
  @IsEnum(SecurityLevel)
  securityLevel?: SecurityLevel;

  @ApiPropertyOptional({ type: CameraSystemDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CameraSystemDto)
  cameraSystem?: CameraSystemDto;

  @ApiPropertyOptional({ type: AccessControlDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccessControlDto)
  accessControl?: AccessControlDto;

  @ApiPropertyOptional({ example: 'INS-001' })
  @IsOptional()
  @IsString()
  insurancePolicy?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storageFee?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  handlingFee?: number;

  @ApiPropertyOptional({ enum: Currency, example: Currency.VND })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ enum: PaymentTerm, example: PaymentTerm.NET_30 })
  @IsOptional()
  @IsEnum(PaymentTerm)
  paymentTerm?: PaymentTerm;

  @ApiPropertyOptional({ example: 'tenant-001' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}

export class QueryWarehouseDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: WarehouseType })
  @IsOptional()
  @IsEnum(WarehouseType)
  type?: WarehouseType;

  @ApiPropertyOptional({ enum: WarehouseStatus })
  @IsOptional()
  @IsEnum(WarehouseStatus)
  status?: WarehouseStatus;

  @ApiPropertyOptional({ example: '01' })
  @IsOptional()
  @IsString()
  provinceCode?: string;

  @ApiPropertyOptional({ example: '00001' })
  @IsOptional()
  @IsString()
  wardCode?: string;

  @ApiPropertyOptional({ enum: Region })
  @IsOptional()
  @IsEnum(Region)
  region?: Region;

  @ApiPropertyOptional({ example: 'tenant-001' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'kho' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '105.8342,21.0285,10' })
  @IsOptional()
  @IsString()
  bbox?: string;
}
