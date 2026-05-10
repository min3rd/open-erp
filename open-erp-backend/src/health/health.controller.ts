import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Gateway health check' })
  getHealth() {
    return {
      status: 'ok',
      service: 'api-gateway',
      uptime: process.uptime(),
      dependencies: {
        redis: process.env.REDIS_URL ? 'configured' : 'not-configured',
        authService: process.env.AUTH_SERVICE_URL ? 'configured' : 'not-configured',
        tenantService: process.env.TENANT_SERVICE_URL
          ? 'configured'
          : 'not-configured',
      },
    };
  }
}
