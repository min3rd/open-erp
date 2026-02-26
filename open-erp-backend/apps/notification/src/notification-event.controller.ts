import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EVENT_NAMES } from '@shared/constants/message.constants';
import { EmailService } from './email.service';
import { UserNotificationService } from './user-notification.service';
import { UserNotificationGateway } from './user-notification.gateway';
import { NotificationType } from '@shared/schemas';

/**
 * NotificationEventController handles incoming events from other services
 * Uses @EventPattern decorators for NestJS microservice pattern
 */
@Controller()
export class NotificationEventController {
  private readonly logger = new Logger(NotificationEventController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly userNotificationService: UserNotificationService,
    private readonly gateway: UserNotificationGateway,
  ) {}

  @EventPattern(EVENT_NAMES.AUTH.USER_REGISTERED)
  async handleUserRegistered(@Payload() data: { email: string }) {
    this.logger.log(
      `Event: ${EVENT_NAMES.AUTH.USER_REGISTERED} - ${data.email}`,
    );
    // Send welcome email when user registers (different from verification email)
    // Note: This is different from verification email, can be implemented later
  }

  @EventPattern(EVENT_NAMES.AUTH.USER_LOGIN)
  async handleUserLogin(@Payload() data: { userId: string }) {
    this.logger.log(`Event: ${EVENT_NAMES.AUTH.USER_LOGIN} - ${data.userId}`);
    // Could send notification about login activity
  }

  @EventPattern(EVENT_NAMES.USER.CREATED)
  async handleUserCreated(@Payload() data: { id: string }) {
    this.logger.log(`Event: ${EVENT_NAMES.USER.CREATED} - ${data.id}`);
  }

  @EventPattern(EVENT_NAMES.USER.UPDATED)
  async handleUserUpdated(@Payload() data: { userId: string }) {
    this.logger.log(`Event: ${EVENT_NAMES.USER.UPDATED} - ${data.userId}`);
  }

  @EventPattern(EVENT_NAMES.USER.DELETED)
  async handleUserDeleted(@Payload() data: { userId: string }) {
    this.logger.log(`Event: ${EVENT_NAMES.USER.DELETED} - ${data.userId}`);
  }

  @EventPattern(EVENT_NAMES.ORGANIZATION.MEMBER_INVITED)
  async handleMemberInvited(
    @Payload()
    data: {
      invitationId: string;
      organizationId: string;
      organizationName: string;
      inviterId?: string;
      inviterName: string;
      inviteeEmail?: string;
      inviteeUserId?: string;
      token: string;
      acceptLink: string;
      expiresAt: Date;
      message?: string;
    },
  ) {
    this.logger.log(
      `Event: ${EVENT_NAMES.ORGANIZATION.MEMBER_INVITED} - invitation ${data.invitationId}`,
    );

    const expiryDate = new Date(data.expiresAt).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 1. Send invitation email
    if (data.inviteeEmail) {
      try {
        const recipientName = data.inviteeEmail;
        await this.emailService.sendInvitationEmail(
          data.inviteeEmail,
          recipientName,
          data.inviterName,
          data.organizationName,
          data.acceptLink,
          expiryDate,
          data.message,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send invitation email to ${data.inviteeEmail}: ${error.message}`,
        );
      }
    }

    // 2. Create in-app notification and push WS for registered users
    if (data.inviteeUserId) {
      try {
        const notification = await this.userNotificationService.create({
          userId: data.inviteeUserId,
          type: NotificationType.INVITATION,
          title: 'notification.invite.title',
          message: 'notification.invite.body',
          sender: data.inviterId
            ? { id: data.inviterId, name: data.inviterName }
            : { id: '', name: data.inviterName },
          metadata: {
            inviteId: data.invitationId,
            orgId: data.organizationId,
            acceptRoute: data.acceptLink,
            targetRoute: `/invitations/accept?token=${data.token}`,
            titleParams: { orgName: data.organizationName },
            bodyParams: {
              inviterName: data.inviterName,
              orgName: data.organizationName,
              expiryDate,
            },
          },
        });

        // 3. Push real-time notification
        try {
          const unreadCount = await this.userNotificationService.unreadCount(
            data.inviteeUserId,
          );
          this.gateway.pushNotification(data.inviteeUserId, {
            id: notification._id?.toString(),
            type: notification.type,
            title: notification.title,
            message: notification.message,
            sender: notification.sender,
            metadata: notification.metadata,
            isRead: notification.isRead,
            createdAt: (notification as any).createdAt,
          });
          this.gateway.pushUnreadCount(data.inviteeUserId, unreadCount);
        } catch (wsError) {
          this.logger.warn(
            `WS push failed for user ${data.inviteeUserId}: ${wsError.message}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to create notification for user ${data.inviteeUserId}: ${error.message}`,
        );
      }
    }
  }
}
