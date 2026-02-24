import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  AUDIO = 'audio',
}

@Schema({ _id: false })
export class Attachment {
  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, required: true })
  filename: string;

  @Prop({ type: String, required: true })
  mimeType: string;

  @Prop({ type: Number, required: true })
  size: number;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

@Schema({ _id: false })
export class ReadReceipt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true, default: Date.now })
  readAt: Date;
}

export const ReadReceiptSchema = SchemaFactory.createForClass(ReadReceipt);

@Schema({ _id: false })
export class EditHistory {
  @Prop({ type: String, default: null })
  previousContent: string | null;

  @Prop({ type: [AttachmentSchema], default: [] })
  previousAttachments: Attachment[];

  @Prop({ type: Date, required: true, default: Date.now })
  editedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  editedBy: Types.ObjectId;
}

export const EditHistorySchema = SchemaFactory.createForClass(EditHistory);

@Schema({
  timestamps: true,
  collection: 'messages',
})
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({
    type: String,
    enum: MessageType,
    required: true,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Prop({ type: String, default: null })
  content: string | null;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Attachment[];

  @Prop({ type: [ReadReceiptSchema], default: [] })
  readBy: ReadReceipt[];

  @Prop({ type: Date, default: null })
  editedAt: Date | null;

  @Prop({ type: [EditHistorySchema], default: [] })
  editHistory: EditHistory[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Compound index for paginated queries within a conversation
MessageSchema.index({ conversationId: 1, createdAt: -1 });
