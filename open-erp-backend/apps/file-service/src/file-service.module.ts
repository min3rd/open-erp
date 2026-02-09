import { Module } from '@nestjs/common';
import { LoggerModule } from '@shared/logger';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';

// Import schemas
import { File, FileSchema } from '@shared/schemas/file.schema';
import {
  FileVersion,
  FileVersionSchema,
} from '@shared/schemas/file-version.schema';
import { User, UserSchema, Role, RoleSchema } from '@shared/schemas';

// Import shared modules
import { MinioModule } from '@shared/services/minio/minio.module';
import { AuthorizationService } from '@shared/authz/authorization.service';

// Import controllers
import { FileController } from './controllers/file.controller';
import { PresignController } from './controllers/presign.controller';
import { OnlyOfficeController } from './controllers/onlyoffice.controller';
import { HealthController } from './controllers/health.controller';

// Import services
import { FileService } from './services/file.service';
import { OnlyOfficeService } from './services/onlyoffice.service';

// Import repositories
import { FileRepository } from './repositories/file.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        return getMongooseOptions(config);
      },
    }),
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: FileVersion.name, schema: FileVersionSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule,
    MinioModule,
  ],
  controllers: [
    FileController,
    PresignController,
    OnlyOfficeController,
    HealthController,
  ],
  providers: [
    FileService,
    OnlyOfficeService,
    FileRepository,
    AuthorizationService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class FileServiceModule {}
