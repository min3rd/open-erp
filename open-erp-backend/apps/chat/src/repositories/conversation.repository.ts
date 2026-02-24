import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
  ConversationType,
} from '@shared/schemas';

@Injectable()
export class ConversationRepository {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
  ) {}

  async create(data: {
    type: ConversationType;
    name?: string | null;
    avatarUrl?: string | null;
    participants: Types.ObjectId[];
    createdBy: Types.ObjectId;
  }): Promise<ConversationDocument> {
    const conversation = new this.conversationModel({
      type: data.type,
      name: data.name || null,
      avatarUrl: data.avatarUrl || null,
      participants: data.participants,
      createdBy: data.createdBy,
      lastMessageAt: null,
      lastMessagePreview: null,
    });
    return conversation.save();
  }

  async findById(id: string): Promise<ConversationDocument | null> {
    return this.conversationModel.findById(id);
  }

  /**
   * Find an existing direct conversation between exactly two participants
   */
  async findDirectBetween(
    userId1: Types.ObjectId,
    userId2: Types.ObjectId,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel.findOne({
      type: ConversationType.DIRECT,
      participants: { $all: [userId1, userId2], $size: 2 },
    });
  }

  /**
   * Find all conversations for a user, sorted by last message
   */
  async findUserConversations(
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: ConversationDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.conversationModel
        .find({ participants: userId })
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('participants', 'fullName email avatarUrl')
        .exec(),
      this.conversationModel.countDocuments({ participants: userId }),
    ]);

    return { items, total };
  }

  /**
   * Update last message preview and timestamp
   */
  async updateLastMessage(
    conversationId: Types.ObjectId,
    preview: string,
    timestamp: Date,
  ): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessagePreview: preview,
      lastMessageAt: timestamp,
    });
  }

  /**
   * Check if a user is a participant in a conversation
   */
  async isParticipant(
    conversationId: string,
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const count = await this.conversationModel.countDocuments({
      _id: new Types.ObjectId(conversationId),
      participants: userId,
    });
    return count > 0;
  }
}
