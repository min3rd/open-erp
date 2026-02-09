import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FileDocument = File & Document;

@Schema({
  timestamps: true,
  collection: 'files',
})
export class File {
  @Prop({ required: true, index: true })
  key: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  contentType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ type: String, index: true })
  uploadedBy?: string;

  @Prop({ type: Date, default: Date.now })
  uploadedAt: Date;

  @Prop({ default: 1 })
  version: number;

  @Prop({ type: String })
  minioVersionId?: string;

  @Prop({ type: String })
  bucket?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ type: String })
  storageClass?: string;

  @Prop({ type: String, index: true })
  organizationId?: string;
}

export const FileSchema = SchemaFactory.createForClass(File);
