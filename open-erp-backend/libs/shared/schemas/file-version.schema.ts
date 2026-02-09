import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FileVersionDocument = FileVersion & Document;

@Schema({
  timestamps: true,
  collection: 'file_versions',
})
export class FileVersion {
  @Prop({ type: Types.ObjectId, ref: 'File', required: true, index: true })
  fileId: Types.ObjectId;

  @Prop({ required: true })
  version: number;

  @Prop({ required: true })
  key: string;

  @Prop({ type: String })
  minioVersionId?: string;

  @Prop({ required: true })
  size: number;

  @Prop({ type: String })
  contentType?: string;

  @Prop({ type: String })
  createdBy?: string;

  @Prop({ type: String })
  reason?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const FileVersionSchema = SchemaFactory.createForClass(FileVersion);
