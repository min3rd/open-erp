export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageContentType = 'text' | 'image' | 'file' | 'system' | 'reaction';

export interface AttachmentDto {
  id: string;
  url: string;
  fileName?: string;
  sizeBytes?: number;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: MessageContentType;
  attachments?: ReadonlyArray<AttachmentDto>;
  status: MessageStatus;
  edited?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
}

export interface ParticipantDto {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
  roles?: ReadonlyArray<string>;
}

export interface ConversationDto {
  id: string;
  title?: string | null;
  participants: ReadonlyArray<ParticipantDto>;
  lastMessage?: MessageDto | null;
  unreadCount?: number;
  isMuted?: boolean;
  isPinned?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
}
