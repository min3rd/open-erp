import { Test, TestingModule } from '@nestjs/testing';
import { NotificationEventController } from './notification-event.controller';
import { NotificationService } from './notification.service';
import { MailService } from '../mail/mail.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('NotificationEventController', () => {
  let controller: NotificationEventController;
  let notificationServiceMock: any;
  let mailServiceMock: any;
  let queueMock: any;

  beforeEach(async () => {
    notificationServiceMock = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    mailServiceMock = {
      sendWorkflowNotificationEmail: jest.fn().mockResolvedValue({}),
    };

    queueMock = {
      add: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationEventController],
      providers: [
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: MailService, useValue: mailServiceMock },
        { provide: getQueueToken('workflow-deadline-queue'), useValue: queueMock },
      ],
    }).compile();

    controller = module.get<NotificationEventController>(NotificationEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleSendNotification', () => {
    it('should save notification and call mail service', async () => {
      const payload = {
        tenantId: 'tenant-123',
        userId: 'user-456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        wfName: 'Nghỉ phép',
        instanceId: 'inst-789',
      };

      await controller.handleSendNotification(payload);

      expect(notificationServiceMock.createNotification).toHaveBeenCalledWith(
        'tenant-123',
        'user-456',
        expect.objectContaining({
          title: 'Yêu cầu phê duyệt mới',
          body: 'Đơn Nghỉ phép đang chờ bạn duyệt.',
          type: 'WORKFLOW_PENDING',
          link: '/approvals/inbox?id=inst-789',
        }),
      );

      expect(mailServiceMock.sendWorkflowNotificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'John',
        'Doe',
        'Nghỉ phép',
        'http://localhost:4200/approvals/inbox?id=inst-789',
      );
    });
  });

  describe('handleScheduleDeadlineReminder', () => {
    it('should schedule a delayed job if delay is positive', async () => {
      const payload = {
        approverId: 'approver-111',
        delay: 5000,
      };

      await controller.handleScheduleDeadlineReminder(payload);

      expect(queueMock.add).toHaveBeenCalledWith(
        'check-step-deadline',
        { approverId: 'approver-111' },
        { delay: 5000 },
      );
    });

    it('should not schedule a job if delay is not positive', async () => {
      const payload = {
        approverId: 'approver-111',
        delay: 0,
      };

      await controller.handleScheduleDeadlineReminder(payload);

      expect(queueMock.add).not.toHaveBeenCalled();
    });
  });
});
