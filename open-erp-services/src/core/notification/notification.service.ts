import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createNotification(
    tenantId: string | null,
    userId: string,
    data: {
      title: string;
      body: string;
      type: NotificationType;
      link?: string;
      parameters?: Record<string, any>;
    },
  ): Promise<Notification> {

    const notif = new Notification();
    notif.tenantId = tenantId;
    notif.userId = userId;
    notif.title = data.title;
    notif.body = data.body;
    notif.type = data.type;
    notif.link = data.link || null;
    notif.parameters = data.parameters || null;
    notif.isRead = false;

    const saved = await this.notificationRepository.save(notif);

    // Push realtime via WebSocket
    this.notificationGateway.sendToUser(tenantId, userId, 'notification:received', {
      id: saved.id,
      title: saved.title,
      body: saved.body,
      type: saved.type,
      link: saved.link,
      parameters: saved.parameters,
      createdAt: saved.createdAt,
    });

    return saved;
  }

  async getNotifications(
    tenantId: string | null,
    userId: string,
    query: { page?: number; limit?: number },
  ): Promise<{ items: Notification[]; meta: { totalItems: number; totalPages: number } }> {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [items, totalItems] = await this.notificationRepository.findAndCount({
      where: { tenantId: tenantId as any, userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        totalItems,
        totalPages,
      },
    };
  }

  async markAsRead(tenantId: string | null, userId: string, id: string): Promise<Notification | null> {
    const notif = await this.notificationRepository.findOne({
      where: { id, tenantId: tenantId as any, userId },
    });

    if (notif) {
      notif.isRead = true;
      return this.notificationRepository.save(notif);
    }
    return null;
  }
}
