import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

@Schema({
  timestamps: true,
  collection: 'conversations',
})
export class Conversation {
  @Prop({
    type: String,
    enum: ConversationType,
    required: true,
    index: true,
  })
  type: ConversationType;

  @Prop({ type: String, default: null })
  name: string | null;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    required: true,
    index: true,
  })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Date, default: null, index: true })
  lastMessageAt: Date | null;

  @Prop({ type: String, default: null })
  lastMessagePreview: string | null;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Compound index for finding direct conversations between two users
ConversationSchema.index({ type: 1, participants: 1 });

// Sort conversations by last message
ConversationSchema.index({ lastMessageAt: -1 });
