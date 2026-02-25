import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageRepository } from '../repositories/message.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageType } from '@shared/schemas';
import { MinioService } from '@shared/services/minio/minio.service';
import { Types } from 'mongoose';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    senderId: string,
    conversationId: string,
    type: MessageType,
    content?: string,
    attachments?: {
      url: string;
      filename: string;
      mimeType: string;
      size: number;
    }[],
  ) {
    const senderObjectId = new Types.ObjectId(senderId);
    const conversationObjectId = new Types.ObjectId(conversationId);

    // Verify sender is a participant
    const isParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      senderObjectId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    // Validate message content
    if (type === MessageType.TEXT && !content) {
      throw new BadRequestException('Content is required for text messages');
    }

    if (
      [
        MessageType.IMAGE,
        MessageType.VIDEO,
        MessageType.FILE,
        MessageType.AUDIO,
      ].includes(type) &&
      (!attachments || attachments.length === 0)
    ) {
      throw new BadRequestException(
        'Attachments are required for multimedia messages',
      );
    }

    // Create message
    const message = await this.messageRepository.create({
      conversationId: conversationObjectId,
      senderId: senderObjectId,
      type,
      content: content || null,
      attachments: attachments || [],
    });

    // Update conversation last message
    const preview =
      type === MessageType.TEXT
        ? (content || '').substring(0, 100)
        : `[${type}]`;

    await this.conversationRepository.updateLastMessage(
      conversationObjectId,
      preview,
      new Date(),
    );

    this.logger.log({
      event: 'message.sent',
      messageId: message._id.toString(),
      conversationId,
      senderId,
      type,
      timestamp: new Date().toISOString(),
    });

    // Presign attachment URLs so the sender can preview immediately
    return this._presignMessageAttachments(message);
  }

  /**
   * Edit a message (only the original sender can edit).
   * Previous content is saved to editHistory for audit trail.
   */
  async editMessage(
    userId: string,
    messageId: string,
    content?: string,
    attachments?: {
      url: string;
      filename: string;
      mimeType: string;
      size: number;
    }[],
  ) {
    if (!content && !attachments) {
      throw new BadRequestException(
        'At least one of content or attachments must be provided',
      );
    }

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only the original sender can edit their message
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Cannot edit deleted messages
    if (message.deletedAt) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    const updated = await this.messageRepository.editMessage(
      messageId,
      new Types.ObjectId(userId),
      { content, attachments },
    );

    this.logger.log({
      event: 'message.edited',
      messageId,
      userId,
      editHistoryCount: updated?.editHistory?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Soft-delete a message (only within configured time window)
   */
  private get deleteWindowMs(): number {
    const minutes = parseInt(
      process.env.MESSAGE_DELETE_WINDOW_MINUTES || '5',
      10,
    );
    return minutes * 60 * 1000;
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only the original sender can delete
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Already deleted
    if (message.deletedAt) {
      throw new BadRequestException('Message is already deleted');
    }

    // Check 5-minute window
    const createdAt = (message as any).createdAt as Date;
    const elapsed = Date.now() - createdAt.getTime();
    if (elapsed > this.deleteWindowMs) {
      const minutes = process.env.MESSAGE_DELETE_WINDOW_MINUTES || '5';
      throw new BadRequestException(
        `Messages can only be deleted within ${minutes} minutes of sending`,
      );
    }

    const deleted = await this.messageRepository.softDelete(messageId);

    this.logger.log({
      event: 'message.deleted',
      messageId,
      userId,
      elapsedMs: elapsed,
      timestamp: new Date().toISOString(),
    });

    return deleted;
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 50,
    before?: string,
  ) {
    const userObjectId = new Types.ObjectId(userId);

    // Verify user is a participant
    const isParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      userObjectId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    const beforeDate = before ? new Date(before) : undefined;

    const { items, total } = await this.messageRepository.findByConversation(
      new Types.ObjectId(conversationId),
      page,
      limit,
      beforeDate,
    );

    // Generate presigned download URLs for attachment URLs so the browser
    // can access the files (raw MinIO URLs require authentication).
    const presignedItems = await Promise.all(
      items.map((msg) => this._presignMessageAttachments(msg)),
    );

    return { items: presignedItems, total };
  }

  /**
   * Extract the MinIO object key from a full URL.
   * e.g. "http://minio:9000/open-erp/chat/file.png" → "chat/file.png"
   */
  private _extractMinioKey(url: string): string | null {
    try {
      const bucket = this.configService.get<string>('MINIO_BUCKET', 'open-erp');
      const parsed = new URL(url);
      const prefix = `/${bucket}/`;
      if (parsed.pathname.startsWith(prefix)) {
        return parsed.pathname.substring(prefix.length);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Convert a Mongoose document (or plain object) to a plain object and
   * replace all attachment URLs with presigned download URLs.
   */
  private async _presignMessageAttachments(msg: any): Promise<any> {
    const plain = (msg as any).toObject
      ? (msg as any).toObject({ virtuals: true })
      : { ...msg };
    if (!plain.attachments?.length) return plain;
    plain.attachments = await Promise.all(
      plain.attachments.map(async (att: any) => {
        try {
          const key = this._extractMinioKey(att.url ?? '');
          if (key) {
            const presigned = await this.minioService.presignDownload(key);
            return { ...att, url: presigned.url };
          }
        } catch {
          // Fall back to original URL if presigning fails
        }
        return att;
      }),
    );
    return plain;
  }

  /**
   * Mark all messages in a conversation as read by the user
   */
  async markAsRead(userId: string, conversationId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // Verify user is a participant
    const isParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      userObjectId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    const count = await this.messageRepository.markAsRead(
      new Types.ObjectId(conversationId),
      userObjectId,
    );

    this.logger.log({
      event: 'messages.read',
      conversationId,
      userId,
      markedCount: count,
      timestamp: new Date().toISOString(),
    });

    return { markedAsRead: count };
  }
}
