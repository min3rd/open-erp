export type ConversationType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'video' | 'file' | 'audio';

// Keep backward-compat alias used across the component
export type MessageContentType = MessageType;

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface AttachmentDto {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface ReadReceipt {
  userId: string;
  readAt: string; // ISO 8601
}

export interface MessageDto {
  id: string;
  _id?: string;
  conversationId: string;
  senderId: string;
  /** Backend field name is 'type', matching MessageType enum */
  type: MessageType;
  /** Alias kept for template compatibility */
  contentType: MessageType;
  content: string | null;
  attachments?: ReadonlyArray<AttachmentDto>;
  readBy?: ReadonlyArray<ReadReceipt>;
  editedAt?: string | null;
  deletedAt?: string | null;
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
  /** Backend field: type ('direct' | 'group') */
  type?: ConversationType;
  /** Backend field: name (group conversations); direct chats may be null */
  name?: string | null;
  /** Convenience alias for display (falls back to name) */
  title?: string | null;
  avatarUrl?: string | null;
  participants: ReadonlyArray<ParticipantDto>;
  lastMessage?: MessageDto | null;
  /** Backend field: ISO date of the last message */
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
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
  type: MessageType;
  content?: string;
  attachments?: AttachmentDto[];
}

export interface CreateDirectConversationPayload {
  participantId: string;
}

export interface CreateGroupConversationPayload {
  /** Backend field is 'name', not 'title' */
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
  type: MessageType;
  content?: string;
  attachments?: AttachmentDto[];
  createdAt: string;
}

export interface WsMessagesReadEvent {
  userId: string;
  conversationId: string;
  markedAsRead: number;
}

