import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ImportExportJob,
  ImportExportJobDocument,
  JobType,
  JobStatus,
  ExportFormat,
  ExportMode,
  ImportMode,
  User,
  UserDocument,
  Product,
  ProductDocument,
  Warehouse,
  WarehouseDocument,
  Organization,
  OrganizationDocument,
} from '@shared/schemas';
import { ExcelParserService, ExportData } from './excel-parser.service';
import { ImportExportJobRepository } from '../repositories/import-export-job.repository';
import { MappingTemplateRepository } from '../repositories/mapping-template.repository';
import { CreateExportJobDto } from '../dto/create-export-job.dto';
import { CreateImportJobDto } from '../dto/create-import-job.dto';
import { SaveMappingTemplateDto } from '../dto/save-mapping-template.dto';

export interface EntityTemplate {
  entity: string;
  label: string;
  fields: Array<{ key: string; label: string; type: string; required: boolean; example?: any }>;
}

@Injectable()
export class DataTransferService {
  private readonly logger = new Logger(DataTransferService.name);

  private readonly entityTemplates: Record<string, EntityTemplate> = {
    users: {
      entity: 'users',
      label: 'Users',
      fields: [
        { key: 'email', label: 'Email', type: 'string', required: true, example: 'user@example.com' },
        { key: 'fullName', label: 'Full Name', type: 'string', required: true, example: 'John Doe' },
        { key: 'phone', label: 'Phone', type: 'string', required: false, example: '+84901234567' },
        { key: 'isActive', label: 'Active', type: 'boolean', required: false, example: true },
      ],
    },
    products: {
      entity: 'products',
      label: 'Products',
      fields: [
        { key: 'sku', label: 'SKU', type: 'string', required: true, example: 'PROD-001' },
        { key: 'name', label: 'Name', type: 'string', required: true, example: 'Product Name' },
        { key: 'description', label: 'Description', type: 'string', required: false, example: 'Product description' },
        { key: 'price', label: 'Price', type: 'number', required: false, example: 99.99 },
        { key: 'unit', label: 'Unit', type: 'string', required: false, example: 'pcs' },
        { key: 'status', label: 'Status', type: 'enum', required: false, example: 'active' },
      ],
    },
    warehouses: {
      entity: 'warehouses',
      label: 'Warehouses',
      fields: [
        { key: 'code', label: 'Code', type: 'string', required: true, example: 'WH-001' },
        { key: 'name', label: 'Name', type: 'string', required: true, example: 'Main Warehouse' },
        { key: 'address', label: 'Address', type: 'string', required: false, example: '123 Main St' },
        { key: 'isActive', label: 'Active', type: 'boolean', required: false, example: true },
      ],
    },
    organizations: {
      entity: 'organizations',
      label: 'Organizations',
      fields: [
        { key: 'name', label: 'Name', type: 'string', required: true, example: 'Org Name' },
        { key: 'code', label: 'Code', type: 'string', required: true, example: 'ORG-001' },
        { key: 'email', label: 'Email', type: 'string', required: false, example: 'org@example.com' },
        { key: 'phone', label: 'Phone', type: 'string', required: false, example: '+84901234567' },
      ],
    },
  };

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Warehouse.name) private warehouseModel: Model<WarehouseDocument>,
    @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
    private readonly excelParser: ExcelParserService,
    private readonly jobRepo: ImportExportJobRepository,
    private readonly mappingRepo: MappingTemplateRepository,
  ) {}

  getTemplates(): EntityTemplate[] {
    return Object.values(this.entityTemplates);
  }

  getTemplate(entity: string): EntityTemplate | undefined {
    return this.entityTemplates[entity];
  }

  async getJobs(userId: string, page = 1, limit = 20) {
    return this.jobRepo.findByUser(userId, page, limit);
  }

  async getJobById(id: string): Promise<ImportExportJobDocument> {
    const job = await this.jobRepo.findById(id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async createExportJob(dto: CreateExportJobDto, userId: string): Promise<ImportExportJobDocument> {
    const template = this.entityTemplates[dto.entity];
    if (!template) {
      throw new BadRequestException(`Unknown entity: ${dto.entity}`);
    }

    const job = await this.jobRepo.create({
      type: JobType.EXPORT,
      status: JobStatus.PROCESSING,
      entity: dto.entity,
      userId: new Types.ObjectId(userId),
      orgId: dto.orgId ? new Types.ObjectId(dto.orgId) : undefined,
      filters: dto.filters,
      format: dto.format || ExportFormat.XLSX,
      exportMode: dto.exportMode || ExportMode.FLAT,
    });

    // Process asynchronously
    const jobId = job._id.toString();
    this.processExportJob(jobId, dto, userId).catch((err) => {
      this.logger.error(`Export job ${jobId} failed: ${err.message}`);
    });

    return job;
  }

  private async processExportJob(
    jobId: string,
    dto: CreateExportJobDto,
    userId: string,
  ): Promise<void> {
    try {
      const data = await this.fetchEntityData(dto.entity, dto.filters, dto.orgId);
      const template = this.entityTemplates[dto.entity];
      const headers = template.fields.map((f) => f.label);
      const rows = data.map((item: any) => {
        const row: Record<string, any> = {};
        template.fields.forEach((f) => {
          row[f.label] = item[f.key] ?? '';
        });
        return row;
      });

      const exportData: ExportData = { entity: template.label, headers, rows };
      const format = dto.format || ExportFormat.XLSX;

      let fileContent: Buffer | string;
      let fileName: string;
      let contentType: string;

      if (format === ExportFormat.CSV) {
        fileContent = this.excelParser.generateCSV(exportData);
        fileName = `${dto.entity}-export-${Date.now()}.csv`;
        contentType = 'text/csv';
      } else {
        fileContent = await this.excelParser.generateXLSX([exportData]);
        fileName = `${dto.entity}-export-${Date.now()}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      // For now, store as base64 data URL (in production, would upload to MinIO)
      const base64 = Buffer.isBuffer(fileContent)
        ? fileContent.toString('base64')
        : Buffer.from(fileContent).toString('base64');

      await this.jobRepo.updateById(jobId, {
        status: JobStatus.COMPLETED,
        totalRows: data.length,
        processedRows: data.length,
        downloadUrl: `data:${contentType};base64,${base64}`,
        fileKey: fileName,
      });
    } catch (err: any) {
      await this.jobRepo.updateById(jobId, {
        status: JobStatus.FAILED,
        errorMessage: err.message,
      });
    }
  }

  private async fetchEntityData(
    entity: string,
    filters?: Record<string, any>,
    orgId?: string,
  ): Promise<any[]> {
    const query: any = filters ? { ...filters } : {};
    if (orgId) query.orgId = new Types.ObjectId(orgId);

    switch (entity) {
      case 'users':
        return this.userModel.find(query).select('-password').limit(1000).lean().exec();
      case 'products':
        return this.productModel.find(query).limit(1000).lean().exec();
      case 'warehouses':
        return this.warehouseModel.find(query).limit(1000).lean().exec();
      case 'organizations':
        return this.organizationModel.find(query).limit(1000).lean().exec();
      default:
        return [];
    }
  }

  async createImportJob(
    dto: CreateImportJobDto,
    file: Express.Multer.File,
    userId: string,
  ): Promise<ImportExportJobDocument> {
    const template = this.entityTemplates[dto.entity];
    if (!template) {
      throw new BadRequestException(`Unknown entity: ${dto.entity}`);
    }

    const job = await this.jobRepo.create({
      type: JobType.IMPORT,
      status: JobStatus.PROCESSING,
      entity: dto.entity,
      userId: new Types.ObjectId(userId),
      orgId: dto.orgId ? new Types.ObjectId(dto.orgId) : undefined,
      importMode: dto.importMode || ImportMode.CREATE_ONLY,
      mapping: dto.mapping,
      originalFileName: file.originalname,
    });

    // Process asynchronously
    const importJobId = job._id.toString();
    this.processImportJob(importJobId, dto, file.buffer, userId).catch((err) => {
      this.logger.error(`Import job ${importJobId} failed: ${err.message}`);
    });

    return job;
  }

  private async processImportJob(
    jobId: string,
    dto: CreateImportJobDto,
    buffer: Buffer,
    userId: string,
  ): Promise<void> {
    try {
      const fileName = `import-${Date.now()}.xlsx`;
      const parsed = await this.excelParser.parseBuffer(buffer, fileName);
      const firstSheet = parsed.sheets[0];
      if (!firstSheet) {
        await this.jobRepo.updateById(jobId, {
          status: JobStatus.FAILED,
          errorMessage: 'No data found in file',
        });
        return;
      }

      const mapping = dto.mapping || {};
      const template = this.entityTemplates[dto.entity];
      const errors: Array<{ row: number; field: string; message: string; value?: any }> = [];
      let created = 0;

      // Build reverse mapping once: entityField -> columnName (O(1) lookup)
      const reverseMapping: Record<string, string> = {};
      Object.entries(mapping).forEach(([col, field]) => {
        reverseMapping[field] = col;
      });

      for (const row of firstSheet.rows) {
        try {
          const entityData: Record<string, any> = {};
          template.fields.forEach((field) => {
            const columnName = reverseMapping[field.key] || field.label || field.key;
            const value = row.data[columnName];
            if (value !== undefined && value !== '') {
              entityData[field.key] = value;
            }
          });

          // Validate required fields
          const missingRequired = template.fields
            .filter((f) => f.required && !entityData[f.key])
            .map((f) => f.key);

          if (missingRequired.length > 0) {
            errors.push({
              row: row.rowIndex,
              field: missingRequired.join(', '),
              message: `Required field(s) missing: ${missingRequired.join(', ')}`,
            });
            continue;
          }

          if (!dto.dryRun) {
            await this.upsertEntityData(dto.entity, entityData, dto.importMode || ImportMode.CREATE_ONLY);
            created++;
          }
        } catch (err: any) {
          errors.push({
            row: row.rowIndex,
            field: 'unknown',
            message: err.message,
          });
        }
      }

      await this.jobRepo.updateById(jobId, {
        status: errors.length === firstSheet.rows.length ? JobStatus.FAILED : JobStatus.COMPLETED,
        totalRows: firstSheet.rows.length,
        processedRows: firstSheet.rows.length,
        createdRows: created,
        failedRows: errors.length,
        sampleErrors: errors.slice(0, 10),
      });
    } catch (err: any) {
      await this.jobRepo.updateById(jobId, {
        status: JobStatus.FAILED,
        errorMessage: err.message,
      });
    }
  }

  private async upsertEntityData(
    entity: string,
    data: Record<string, any>,
    mode: ImportMode,
  ): Promise<void> {
    switch (entity) {
      case 'products':
        if (mode === ImportMode.CREATE_ONLY) {
          await this.productModel.create(data);
        } else if (mode === ImportMode.UPSERT && data.sku) {
          await this.productModel.findOneAndUpdate({ sku: data.sku }, { $set: data }, { upsert: true, new: true });
        }
        break;
      case 'warehouses':
        if (mode === ImportMode.CREATE_ONLY) {
          await this.warehouseModel.create(data);
        } else if (mode === ImportMode.UPSERT && data.code) {
          await this.warehouseModel.findOneAndUpdate({ code: data.code }, { $set: data }, { upsert: true, new: true });
        }
        break;
      default:
        this.logger.warn(`Upsert not implemented for entity: ${entity}`);
    }
  }

  async getMappingTemplates(entity: string, userId: string) {
    return this.mappingRepo.findByEntity(entity, userId);
  }

  async saveMappingTemplate(dto: SaveMappingTemplateDto, userId: string) {
    return this.mappingRepo.create({
      name: dto.name,
      entity: dto.entity,
      userId: new Types.ObjectId(userId),
      orgId: dto.orgId ? new Types.ObjectId(dto.orgId) : undefined,
      mapping: dto.mapping,
      isDefault: dto.isDefault || false,
    });
  }

  async deleteMappingTemplate(id: string): Promise<void> {
    await this.mappingRepo.deleteById(id);
  }

  async downloadExport(jobId: string): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
    const job = await this.getJobById(jobId);
    if (job.type !== JobType.EXPORT || job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Export job not completed');
    }

    if (!job.downloadUrl) {
      throw new NotFoundException('Download not available');
    }

    // Parse data URL
    const matches = job.downloadUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new BadRequestException('Invalid download URL format');
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = contentType.includes('csv') ? 'csv' : 'xlsx';
    const fileName = `${job.entity}-export-${job._id.toString()}.${ext}`;

    return { buffer, fileName, contentType };
  }
}
