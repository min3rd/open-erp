import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveRequest, LeaveRequestSchema } from './schemas/leave-request.schema';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
    ]),
  ],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
