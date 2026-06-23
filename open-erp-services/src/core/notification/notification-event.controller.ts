import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { MailService } from '../mail/mail.service';
import { NotificationType } from './entities/notification.entity';

@Controller()
export class NotificationEventController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @InjectQueue('workflow-deadline-queue')
    private readonly workflowDeadlineQueue: Queue,
  ) {}

  @EventPattern('send_notification')
  async handleSendNotification(
    @Payload()
    data: {
      tenantId: string | null;
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      wfName: string;
      instanceId: string;
    },
  ) {
    const titleKey = 'notification.workflow.new_approval_request.title';
    const bodyKey = 'notification.workflow.new_approval_request.body';
    const link = `/approvals/inbox?id=${data.instanceId}`;

    try {
      // 1. Save in-app notification & push WS realtime event
      await this.notificationService.createNotification(data.tenantId, data.userId, {
        title: titleKey,
        body: bodyKey,
        type: NotificationType.WORKFLOW_PENDING,
        link,
        parameters: { wfName: data.wfName },
      });


      // 2. Queue email alert asynchronously
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
      const webUrl = `${frontendUrl}${link}`;
      await this.mailService.sendWorkflowNotificationEmail(
        data.email,
        data.firstName || '',
        data.lastName || '',
        data.wfName,
        webUrl,
      );
    } catch (err) {
      console.error('[Microservice] Failed to process send_notification event:', err);
    }
  }

  @EventPattern('schedule_deadline_reminder')
  async handleScheduleDeadlineReminder(
    @Payload()
    data: {
      approverId: string;
      delay: number;
    },
  ) {
    try {
      if (data.delay > 0) {
        await this.workflowDeadlineQueue.add(
          'check-step-deadline',
          { approverId: data.approverId },
          { delay: data.delay },
        );
        console.log(`[Microservice] Scheduled deadline reminder for approver ${data.approverId} in ${data.delay}ms`);
      }
    } catch (err) {
      console.error('[Microservice] Failed to schedule deadline reminder job:', err);
    }
  }
}
