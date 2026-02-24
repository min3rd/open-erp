import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageType } from '@shared/schemas';
import { Types } from 'mongoose';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
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

    return message;
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

    return this.messageRepository.findByConversation(
      new Types.ObjectId(conversationId),
      page,
      limit,
      beforeDate,
    );
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
