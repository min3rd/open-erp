import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowStepAssignee } from './entities/workflow-step-assignee.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowApprover } from './entities/workflow-approver.entity';
import { WorkflowLog } from './entities/workflow-log.entity';
import { WorkflowConsultation } from './entities/workflow-consultation.entity';
import { WorkflowLogService } from './workflow-log.service';
import { WorkflowService } from './workflow.service';
import { WorkflowInstanceService } from './workflow-instance.service';
import { CoreDocumentTemplateModule } from '../document-template/document-template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowStep,
      WorkflowStepAssignee,
      WorkflowInstance,
      WorkflowApprover,
      WorkflowLog,
      WorkflowConsultation,
    ]),
    forwardRef(() => CoreDocumentTemplateModule),
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: config.get('REDIS_HOST', 'localhost'),
            port: config.get('REDIS_PORT', 6379),
          },
        }),
      },
    ]),
  ],
  providers: [
    WorkflowLogService,
    WorkflowService,
    WorkflowInstanceService,
  ],
  exports: [
    WorkflowLogService,
    WorkflowService,
    WorkflowInstanceService,
    TypeOrmModule,
    ClientsModule, // Export ClientProxy so Feature modules or other services can use it if needed
  ],
})
export class WorkflowModule {}

