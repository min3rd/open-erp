import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '@shared/authz/jwt-auth.guard';
import { PermissionsGuard } from '@shared/authz/permissions.guard';
import { Permissions } from '@shared/authz/decorators';
import { Permission } from '@shared/types';
import { ok, created, deleted, paginated } from '@shared/response';
import { DataTransferService } from '../services/data-transfer.service';
import { CreateExportJobDto } from '../dto/create-export-job.dto';
import { CreateImportJobDto } from '../dto/create-import-job.dto';
import { SaveMappingTemplateDto } from '../dto/save-mapping-template.dto';

@ApiTags('import-export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('import-export')
export class DataTransferController {
  constructor(private readonly service: DataTransferService) {}

  @Get('templates')
  @ApiOperation({ summary: 'List available entity templates' })
  getTemplates() {
    return ok(this.service.getTemplates());
  }

  @Get('templates/:entity')
  @ApiOperation({ summary: 'Get template for specific entity' })
  getTemplate(@Param('entity') entity: string) {
    const template = this.service.getTemplate(entity);
    return ok(template);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List all jobs for current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Search by entity name' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by job type (export/import)' })
  @ApiQuery({ name: 'entity', required: false, description: 'Filter by entity' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'sortField', required: false, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc (default: desc)' })
  async getJobs(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('entity') entity?: string,
    @Query('status') status?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const userId = req.user?.userId;
    const result = await this.service.getJobs(userId, { q, type, entity, status, sortField, sortOrder, page, limit });
    return paginated(result.items, page, limit, result.total);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get job status' })
  async getJob(@Param('jobId') jobId: string) {
    const job = await this.service.getJobById(jobId);
    return ok(job);
  }

  @Post('export')
  @ApiOperation({ summary: 'Initiate an export job' })
  @Permissions(Permission.IMPORT_EXPORT_EXPORT)
  async createExport(@Body() dto: CreateExportJobDto, @Req() req: any) {
    const userId = req.user?.userId;
    const job = await this.service.createExportJob(dto, userId);
    return created(job, 'Export job created');
  }

  @Get('export/:jobId/status')
  @ApiOperation({ summary: 'Get export job status' })
  async getExportStatus(@Param('jobId') jobId: string) {
    const job = await this.service.getJobById(jobId);
    return ok({
      id: job._id.toString(),
      status: job.status,
      progress: job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0,
    });
  }

  @Get('export/:jobId/download')
  @ApiOperation({ summary: 'Get presigned download URL for export file' })
  async downloadExport(@Param('jobId') jobId: string) {
    const url = await this.service.getDownloadUrl(jobId);
    return ok({ url });
  }

  @Post('import')
  @ApiOperation({ summary: 'Upload and process import file' })
  @ApiConsumes('multipart/form-data')
  @Permissions(Permission.IMPORT_EXPORT_IMPORT)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (_req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.csv', '.xls'];
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/plain',
          'application/csv',
        ];
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
        if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(`File type not allowed. Accepted extensions: ${allowedExtensions.join(', ')}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async createImport(
    @Body() dto: CreateImportJobDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    const job = await this.service.createImportJob(dto, file, userId);
    return created(job, 'Import job created');
  }

  @Get('import/:jobId/status')
  @ApiOperation({ summary: 'Get import job status' })
  async getImportStatus(@Param('jobId') jobId: string) {
    const job = await this.service.getJobById(jobId);
    return ok({
      id: job._id.toString(),
      status: job.status,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      createdRows: job.createdRows,
      updatedRows: job.updatedRows,
      failedRows: job.failedRows,
      sampleErrors: job.sampleErrors,
    });
  }

  @Get('import/:jobId/errors/download')
  @ApiOperation({ summary: 'Download error report for import job' })
  async downloadErrors(@Param('jobId') jobId: string, @Res() res: Response) {
    const job = await this.service.getJobById(jobId);
    const errors = job.sampleErrors || [];

    const csv = [
      'Row,Field,Message,Value',
      ...errors.map((e) => `${e.row},"${e.field}","${e.message}","${e.value || ''}"`),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="import-errors-${jobId}.csv"`);
    res.send(csv);
  }

  @Get('mappings')
  @ApiOperation({ summary: 'Get mapping templates for entity' })
  @ApiQuery({ name: 'entity', required: true })
  async getMappings(@Query('entity') entity: string, @Req() req: any) {
    const userId = req.user?.userId;
    const mappings = await this.service.getMappingTemplates(entity, userId);
    return ok(mappings);
  }

  @Post('mappings')
  @ApiOperation({ summary: 'Save a mapping template' })
  @Permissions(Permission.IMPORT_EXPORT_MANAGE)
  async saveMapping(@Body() dto: SaveMappingTemplateDto, @Req() req: any) {
    const userId = req.user?.userId;
    const mapping = await this.service.saveMappingTemplate(dto, userId);
    return created(mapping, 'Mapping template saved');
  }

  @Delete('mappings/:id')
  @ApiOperation({ summary: 'Delete a mapping template' })
  @Permissions(Permission.IMPORT_EXPORT_MANAGE)
  async deleteMapping(@Param('id') id: string) {
    await this.service.deleteMappingTemplate(id);
    return deleted('Mapping template deleted');
  }
}
