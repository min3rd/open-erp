import { Module } from '@nestjs/common';
import { WorkflowLogController } from './workflow-log.controller';
import { WorkflowController } from './workflow.controller';
import { WorkflowInstanceController } from './workflow-instance.controller';
import { WorkflowModule as CoreWorkflowModule } from '../../core/workflow/workflow.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CoreWorkflowModule, AuthModule],
  controllers: [WorkflowLogController, WorkflowController, WorkflowInstanceController],
})
export class WorkflowModule {}
