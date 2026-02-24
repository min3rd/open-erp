import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
  MessageType,
  Attachment,
} from '@shared/schemas';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  async create(data: {
    conversationId: Types.ObjectId;
    senderId: Types.ObjectId;
    type: MessageType;
    content?: string | null;
    attachments?: Attachment[];
  }): Promise<MessageDocument> {
    const message = new this.messageModel({
      conversationId: data.conversationId,
      senderId: data.senderId,
      type: data.type,
      content: data.content || null,
      attachments: data.attachments || [],
      readBy: [{ userId: data.senderId, readAt: new Date() }],
    });
    return message.save();
  }

  /**
   * Find messages by conversation with pagination (newest first)
   */
  async findByConversation(
    conversationId: Types.ObjectId,
    page: number = 1,
    limit: number = 50,
    before?: Date,
  ): Promise<{ items: MessageDocument[]; total: number }> {
    const query: any = {
      conversationId,
      deletedAt: null,
    };

    if (before) {
      query.createdAt = { $lt: before };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'fullName email avatarUrl')
        .exec(),
      this.messageModel.countDocuments(query),
    ]);

    return { items, total };
  }

  /**
   * Mark messages as read by a user
   */
  async markAsRead(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<number> {
    const result = await this.messageModel.updateMany(
      {
        conversationId,
        'readBy.userId': { $ne: userId },
        deletedAt: null,
      },
      {
        $addToSet: { readBy: { userId, readAt: new Date() } },
      },
    );
    return result.modifiedCount;
  }

  async findById(id: string): Promise<MessageDocument | null> {
    return this.messageModel.findById(id);
  }
}
