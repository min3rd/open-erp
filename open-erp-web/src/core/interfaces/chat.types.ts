export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageContentType = 'text' | 'image' | 'video' | 'file' | 'audio' | 'system' | 'reaction';

export interface AttachmentDto {
  id?: string;
  url: string;
  filename?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  sizeBytes?: number;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageDto {
  id: string;
  _id?: string;
  conversationId: string;
  senderId: string;
  senderInfo?: ParticipantDto;
  content: string;
  type?: MessageContentType;
  contentType: MessageContentType;
  attachments?: ReadonlyArray<AttachmentDto>;
  status: MessageStatus;
  edited?: boolean;
  deleted?: boolean;
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
  _id?: string;
  title?: string | null;
  participants: ReadonlyArray<ParticipantDto>;
  lastMessage?: MessageDto | null;
  unreadCount?: number;
  isMuted?: boolean;
  isPinned?: boolean;
  isGroup?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
}

export interface SendMessagePayload {
  conversationId: string;
  type: MessageContentType;
  content?: string;
  attachments?: {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
}

export interface CreateDirectConversationPayload {
  participantId: string;
}

export interface CreateGroupConversationPayload {
  name: string;
  participantIds: string[];
  avatarUrl?: string;
}

export interface UploadedAttachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
}

export interface TypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface WsNewMessageEvent {
  _id: string;
  conversationId: string;
  senderId: string;
  type: MessageContentType;
  content?: string;
  attachments?: AttachmentDto[];
  createdAt: string;
}

export interface WsMessagesReadEvent {
  userId: string;
  conversationId: string;
  markedAsRead: number;
}
