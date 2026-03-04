import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ReceiptDocument = HydratedDocument<Receipt>;

export enum ReceiptStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PARTIAL = 'partial',
  RECEIVED = 'received',
  QC_PENDING = 'qc_pending',
  QC_PASSED = 'qc_passed',
  QC_FAILED = 'qc_failed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum QcStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

@Schema({ _id: false })
export class ReceiptLine {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  skuId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  skuCode?: string;

  @Prop({ type: String })
  skuName?: string;

  @Prop({ type: Number, required: true, min: 0 })
  orderedQty: number;

  @Prop({ type: Number, default: 0, min: 0 })
  receivedQty: number;

  @Prop({ type: String })
  unit?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Lot' })
  lotId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: [String], default: [] })
  serials: string[];

  @Prop({ type: String, enum: QcStatus, default: QcStatus.PENDING })
  qcStatus: QcStatus;

  @Prop({ type: String })
  qcNotes?: string;

  @Prop({ type: Number, default: 0 })
  defectQty: number;

  @Prop({ type: String })
  quarantineBin?: string;
}

export const ReceiptLineSchema = SchemaFactory.createForClass(ReceiptLine);

@Schema({
  timestamps: true,
  collection: 'receipts',
  versionKey: false,
})
export class Receipt extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  orgId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Warehouse', required: true, index: true })
  warehouseId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, index: true })
  poId?: string;

  @Prop({ type: String })
  supplier?: string;

  @Prop({ type: String, enum: ReceiptStatus, default: ReceiptStatus.DRAFT, index: true })
  status: ReceiptStatus;

  @Prop({ type: [ReceiptLineSchema], default: [] })
  lines: ReceiptLine[];

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  receivedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  receivedAt?: Date;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);

ReceiptSchema.index({ orgId: 1, status: 1 });
ReceiptSchema.index({ warehouseId: 1, status: 1 });
ReceiptSchema.index({ createdAt: -1 });

ReceiptSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

ReceiptSchema.set('toObject', {
  virtuals: true,
  transform: function (_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});
