import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ok } from '@shared/response';
import { FileService } from '../services/file.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  @ApiOperation({ summary: 'Service health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return ok({
      status: 'ok',
      service: 'file-service',
      timestamp: new Date().toISOString(),
    });
  }

  @Get('minio')
  @ApiOperation({ summary: 'MinIO connectivity health check' })
  @ApiResponse({ status: 200, description: 'MinIO health status' })
  async minioHealth() {
    const health = await this.fileService.getMinioHealth();
    return ok(health);
  }
}
