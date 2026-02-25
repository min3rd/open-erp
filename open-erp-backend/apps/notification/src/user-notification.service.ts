import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserNotification,
  UserNotificationDocument,
  NotificationType,
} from '@shared/schemas';
import {
  ListNotificationsQueryDto,
  CreateNotificationDto,
} from './dto/user-notification.dto';

@Injectable()
export class UserNotificationService {
  private readonly logger = new Logger(UserNotificationService.name);

  constructor(
    @InjectModel(UserNotification.name)
    private readonly notificationModel: Model<UserNotificationDocument>,
  ) {}

  async list(userId: string, query: ListNotificationsQueryDto) {
    const { type, page = 1, size = 20, unreadOnly } = query;
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };
    if (type) filter.type = type;
    if (unreadOnly) filter.isRead = false;

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(filter),
    ]);

    const unreadCount = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });

    return {
      items: items.map((n) => this._serialize(n)),
      total,
      page,
      size,
      unreadCount,
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async markRead(userId: string, ids: string[]) {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    await this.notificationModel.updateMany(
      { _id: { $in: objectIds }, userId: new Types.ObjectId(userId) },
      { $set: { isRead: true, readAt: new Date() } },
    );
    return { updated: ids.length };
  }

  async markUnread(userId: string, ids: string[]) {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    await this.notificationModel.updateMany(
      { _id: { $in: objectIds }, userId: new Types.ObjectId(userId) },
      { $set: { isRead: false, readAt: null } },
    );
    return { updated: ids.length };
  }

  async markAllRead(userId: string) {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
    return { updated: result.modifiedCount };
  }

  async deleteOne(userId: string, id: string) {
    const doc = await this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!doc) throw new NotFoundException('Notification not found');
    return { deleted: true };
  }

  async create(dto: CreateNotificationDto): Promise<UserNotificationDocument> {
    const doc = await this.notificationModel.create({
      userId: new Types.ObjectId(dto.userId),
      type: dto.type ?? NotificationType.GENERAL,
      title: dto.title,
      message: dto.message ?? null,
      sender: dto.sender ?? null,
      metadata: dto.metadata ?? {},
      isRead: false,
    });
    return doc;
  }

  private _serialize(n: any) {
    return {
      id: n._id?.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      sender: n.sender,
      metadata: n.metadata,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
  }
}
