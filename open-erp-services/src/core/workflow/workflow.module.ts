import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowStepAssignee } from './entities/workflow-step-assignee.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowApprover } from './entities/workflow-approver.entity';
import { WorkflowLog } from './entities/workflow-log.entity';
import { WorkflowLogService } from './workflow-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowStep,
      WorkflowStepAssignee,
      WorkflowInstance,
      WorkflowApprover,
      WorkflowLog,
    ]),
  ],
  providers: [WorkflowLogService],
  exports: [WorkflowLogService, TypeOrmModule],
})
export class WorkflowModule {}
