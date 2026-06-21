import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
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
import { WorkflowDeadlineConsumer } from './workflow-deadline.consumer';
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
    BullModule.registerQueue({
      name: 'workflow-deadline-queue',
    }),
    forwardRef(() => CoreDocumentTemplateModule),
  ],
  providers: [
    WorkflowLogService,
    WorkflowService,
    WorkflowInstanceService,
    WorkflowDeadlineConsumer,
  ],
  exports: [
    WorkflowLogService,
    WorkflowService,
    WorkflowInstanceService,
    WorkflowDeadlineConsumer,
    TypeOrmModule,
  ],
})
export class WorkflowModule {}
