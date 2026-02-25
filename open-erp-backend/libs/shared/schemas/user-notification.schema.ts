import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserNotificationDocument = UserNotification & Document;

export enum NotificationType {
  GENERAL = 'general',
  INVITATION = 'invitation',
  TASK = 'task',
  SYSTEM = 'system',
}

@Schema({ _id: false })
export class NotificationSender {
  @Prop({ type: String, required: true })
  id: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;
}

export const NotificationSenderSchema =
  SchemaFactory.createForClass(NotificationSender);

@Schema({
  timestamps: true,
  collection: 'user_notifications',
})
export class UserNotification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: NotificationType,
    required: true,
    default: NotificationType.GENERAL,
    index: true,
  })
  type: NotificationType;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, default: null })
  message: string | null;

  @Prop({ type: NotificationSenderSchema, default: null })
  sender: NotificationSender | null;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Boolean, default: false, index: true })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const UserNotificationSchema =
  SchemaFactory.createForClass(UserNotification);

// Compound indexes for efficient pagination
UserNotificationSchema.index({ userId: 1, createdAt: -1 });
UserNotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
UserNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
