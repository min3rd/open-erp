import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DocumentDocument = HydratedDocument<WorkDocument>;

@Schema({ timestamps: true })
export class WorkDocument {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: 'draft' })
  status: string; // draft | published | archived

  @Prop()
  content: string;

  @Prop()
  fileUrl: string;

  @Prop()
  mimeType: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  createdBy: string;
}

export const WorkDocumentSchema = SchemaFactory.createForClass(WorkDocument);

WorkDocumentSchema.index({ tenantId: 1, status: 1 });
