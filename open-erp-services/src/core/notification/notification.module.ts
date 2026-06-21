import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationEventController } from './notification-event.controller';
import { MailModule } from '../mail/mail.module';
import { WorkflowDeadlineConsumer } from '../workflow/workflow-deadline.consumer';
import { WorkflowApprover } from '../workflow/entities/workflow-approver.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, WorkflowApprover]),
    JwtModule.register({
      secret: 'super-secret-jwt-key',
      signOptions: { expiresIn: '15m' },
    }),
    BullModule.registerQueue({
      name: 'workflow-deadline-queue',
    }),
    MailModule,
  ],
  controllers: [NotificationEventController],
  providers: [
    NotificationGateway,
    NotificationService,
    WorkflowDeadlineConsumer,
  ],
  exports: [NotificationGateway, NotificationService],
})
export class CoreNotificationModule {}


