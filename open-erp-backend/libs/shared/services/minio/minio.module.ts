import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioService } from './minio.service';

/**
 * Global module for MinIO service
 * Makes MinIO service available throughout the application
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
