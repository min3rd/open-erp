export enum NotificationType {
  GENERAL = 'general',
  INVITATION = 'invitation',
  TASK = 'task',
  SYSTEM = 'system',
}

export interface NotificationSender {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  sender?: NotificationSender | null;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  items: NotificationDto[];
  total: number;
  page: number;
  size: number;
  unreadCount: number;
}

export interface WsNotificationEvent {
  event: 'new';
  notification: NotificationDto;
}
