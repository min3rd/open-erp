import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationType } from '@shared/schemas';
import { Types } from 'mongoose';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * Create a direct (1-to-1) conversation.
   * Returns existing conversation if one already exists between the two users.
   */
  async createDirect(currentUserId: string, participantId: string) {
    if (currentUserId === participantId) {
      throw new BadRequestException(
        'Cannot create a conversation with yourself',
      );
    }

    const userId = new Types.ObjectId(currentUserId);
    const otherId = new Types.ObjectId(participantId);

    // Check for existing direct conversation
    const existing = await this.conversationRepository.findDirectBetween(
      userId,
      otherId,
    );

    if (existing) {
      this.logger.log(
        `Returning existing direct conversation: ${existing._id}`,
      );
      return existing;
    }

    // Create new direct conversation
    const conversation = await this.conversationRepository.create({
      type: ConversationType.DIRECT,
      participants: [userId, otherId],
      createdBy: userId,
    });

    this.logger.log({
      event: 'conversation.created',
      type: 'direct',
      conversationId: conversation._id.toString(),
      participants: [currentUserId, participantId],
      timestamp: new Date().toISOString(),
    });

    return conversation;
  }

  /**
   * Create a group conversation
   */
  async createGroup(
    currentUserId: string,
    name: string,
    participantIds: string[],
    avatarUrl?: string,
  ) {
    const userId = new Types.ObjectId(currentUserId);

    // Ensure creator is included in participants
    const allParticipantIds = new Set([currentUserId, ...participantIds]);
    const participants = Array.from(allParticipantIds).map(
      (id) => new Types.ObjectId(id),
    );

    const conversation = await this.conversationRepository.create({
      type: ConversationType.GROUP,
      name,
      avatarUrl: avatarUrl || null,
      participants,
      createdBy: userId,
    });

    this.logger.log({
      event: 'conversation.created',
      type: 'group',
      conversationId: conversation._id.toString(),
      name,
      participantCount: participants.length,
      timestamp: new Date().toISOString(),
    });

    return conversation;
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(userId: string, page: number = 1, limit: number = 20) {
    return this.conversationRepository.findUserConversations(
      new Types.ObjectId(userId),
      page,
      limit,
    );
  }

  /**
   * Get a single conversation by ID (with participant check)
   */
  async getConversation(conversationId: string, userId: string) {
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );

    if (!isParticipant) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
