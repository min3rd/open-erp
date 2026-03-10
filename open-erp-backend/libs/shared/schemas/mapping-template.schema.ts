import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MappingTemplateDocument = MappingTemplate & Document;

@Schema({
  collection: 'mapping_templates',
  timestamps: true,
  versionKey: false,
})
export class MappingTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  entity: string;

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  orgId?: Types.ObjectId;

  @Prop({ type: Object, required: true })
  mapping: Record<string, string>;

  @Prop({ default: false })
  isDefault: boolean;
}

export const MappingTemplateSchema =
  SchemaFactory.createForClass(MappingTemplate);
