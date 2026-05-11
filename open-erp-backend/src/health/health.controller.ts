import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { HealthDependencyProbeService } from './health-dependency-probe.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthDependencyProbeService: HealthDependencyProbeService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Gateway health check' })
  async getHealth() {
    return {
      status: 'ok',
      service: 'api-gateway',
      uptime: process.uptime(),
      dependencies: await this.healthDependencyProbeService.probeAll(),
    };
  }
}
