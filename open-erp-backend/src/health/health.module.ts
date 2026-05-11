import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthDependencyProbeService } from './health-dependency-probe.service';

@Module({
  controllers: [HealthController],
  providers: [HealthDependencyProbeService],
})
export class HealthModule {}
