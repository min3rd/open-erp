import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkflowRequest, WorkflowRequestSchema } from './schemas/workflow-request.schema';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkflowRequest.name, schema: WorkflowRequestSchema },
    ]),
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
