import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WmsImportJobRepository } from '../repositories/import-job.repository';
import { CreateImportJobDto } from '../dto/data-import.dto';
import { JobType, JobStatus } from '@shared/schemas';

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  private readonly supportedEntities = ['product', 'inventory_stock'];

  async createImportJob(
    tenantId: string,
    file: Express.Multer.File,
    dto: CreateImportJobDto,
    userId: string,
  ) {
    this.logger.log(
      `[WMS] Tenant ${tenantId} — createImportJob entity=${dto.entity}`,
    );

    if (!this.supportedEntities.includes(dto.entity)) {
      throw new BadRequestException(
        `Entity "${dto.entity}" is not supported. Supported: ${this.supportedEntities.join(', ')}`,
      );
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const job = await this.importJobRepo.create(tenantId, {
      type: JobType.IMPORT,
      status: JobStatus.PENDING,
      entity: dto.entity,
      userId: userId as unknown as import('mongoose').Types.ObjectId,
      originalFileName: file.originalname,
      fileSize: file.size,
      importMode: dto.mode,
      mappingTemplateId: dto.mappingTemplateId as unknown as import('mongoose').Types.ObjectId,
    } as any);

    // Trong thực tế: publish job lên queue để worker xử lý async
    // this.rabbitClient.emit('wms.import.process', { jobId: job._id, tenantId });
    this.logger.log(`[WMS] Import job created: ${job._id}`);

    return job;
  }

  async getJobStatus(tenantId: string, jobId: string) {
    const job = await this.importJobRepo.findByIdAndTenant(tenantId, jobId);
    if (!job) {
      throw new NotFoundException(`Import job ${jobId} not found`);
    }
    return job;
  }

  async listJobs(
    tenantId: string,
    filter: { status?: JobStatus; entity?: string } = {},
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const { items, total } = await this.importJobRepo.findByTenant(
      tenantId,
      filter,
      { skip, limit },
    );

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  constructor(private readonly importJobRepo: WmsImportJobRepository) {}
}
