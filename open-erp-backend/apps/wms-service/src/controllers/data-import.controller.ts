import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { DataImportService } from '../services/data-import.service';
import { CreateImportJobDto } from '../dto/data-import.dto';
import { JwtAuthGuard, CurrentUser } from '@shared/authz';
import type { UserContext } from '@shared/authz';
import { created, fetched, paginated } from '@shared/response';
import { JobStatus } from '@shared/schemas';

@ApiTags('wms-data-import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wms/import')
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Danh sách import/export jobs' })
  async listJobs(
    @CurrentUser() user: UserContext,
    @Query('status') status?: JobStatus,
    @Query('entity') entity?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.dataImportService.listJobs(
      user.organizationId!,
      { status, entity },
      { page: +page, limit: +limit },
    );
    return paginated(result.items, result.page, result.limit, result.total);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Trạng thái import job' })
  @ApiParam({ name: 'jobId', description: 'Import job ID' })
  async getJobStatus(
    @CurrentUser() user: UserContext,
    @Param('jobId') jobId: string,
  ) {
    const job = await this.dataImportService.getJobStatus(
      user.organizationId!,
      jobId,
    );
    return fetched(job, 'Import job found');
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload file và tạo import job' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Import job created' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndImport(
    @CurrentUser() user: UserContext,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateImportJobDto,
  ) {
    const job = await this.dataImportService.createImportJob(
      user.organizationId!,
      file,
      dto,
      user.userId,
    );
    return created(job, 'Import job created');
  }
}
