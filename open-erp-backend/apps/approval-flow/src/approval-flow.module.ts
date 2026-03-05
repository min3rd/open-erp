import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { MulterModule } from '@nestjs/platform-express';
import { LoggerModule } from '@shared/logger';
import { getDatabaseConfig, getMongooseOptions } from '@shared/database';
import { MinioModule } from '@shared/services/minio/minio.module';

import {
  ApprovalWorkflowTemplate,
  ApprovalWorkflowTemplateSchema,
  ApprovalRequest,
  ApprovalRequestSchema,
  User,
  UserSchema,
  Organization,
  OrganizationSchema,
  Department,
  DepartmentSchema,
  Role,
  RoleSchema,
} from '@shared/schemas';

import { WorkflowTemplateController } from './controllers/workflow-template.controller';
import { ApprovalRequestController } from './controllers/approval-request.controller';
import { HealthController } from './controllers/health.controller';
import { WorkflowTemplateService } from './services/workflow-template.service';
import { ApprovalRequestService } from './services/approval-request.service';
import { WorkflowTemplateRepository } from './repositories/workflow-template.repository';
import { ApprovalRequestRepository } from './repositories/approval-request.repository';
import { AuthorizationService } from '@shared/authz/authorization.service';
import { PermissionService } from '@shared/services';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = getDatabaseConfig();
        return getMongooseOptions(config);
      },
    }),
    MongooseModule.forFeature([
      {
        name: ApprovalWorkflowTemplate.name,
        schema: ApprovalWorkflowTemplateSchema,
      },
      { name: ApprovalRequest.name, schema: ApprovalRequestSchema },
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } }),
    LoggerModule,
    MinioModule,
  ],
  controllers: [
    WorkflowTemplateController,
    ApprovalRequestController,
    HealthController,
  ],
  providers: [
    WorkflowTemplateService,
    ApprovalRequestService,
    WorkflowTemplateRepository,
    ApprovalRequestRepository,
    AuthorizationService,
    PermissionService,
  ],
})
export class ApprovalFlowModule {}
