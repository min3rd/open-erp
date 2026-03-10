import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { MinioObject, MinioObjectSchema } from './minio-object.schema';

export type ReceiptDocument = HydratedDocument<Receipt>;

export enum ReceiptStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PARTIAL = 'partial',
  RECEIVED = 'received',
  QC_PENDING = 'qc_pending',
  QC_PASSED = 'qc_passed',
  QC_FAILED = 'qc_failed',
  COMPLETED = 'completed',
  FINALIZED = 'finalized',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ReceiptType {
  PO_RECEIPT = 'po_receipt',
  TRANSFER = 'transfer',
  MANUAL = 'manual',
}

export enum QcStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

@Schema({ _id: false })
export class AuditEntry {
  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  timestamp: Date;

  @Prop({ type: String })
  ip?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  payload?: any;
}

export const AuditEntrySchema = SchemaFactory.createForClass(AuditEntry);

@Schema({ _id: false })
export class ReferenceDoc {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String })
  refId?: string;

  @Prop({ type: String })
  url?: string;

  /** Attached MinIO file (uploaded from user's computer or pulled from URL) */
  @Prop({ type: MinioObjectSchema })
  attachment?: MinioObject;

  /** Receipt line IDs this document is linked to */
  @Prop({ type: [String], default: [] })
  lineIds?: string[];
}

export const ReferenceDocSchema = SchemaFactory.createForClass(ReferenceDoc);

@Schema({ _id: false })
export class ReceiptLine {
  @Prop({ type: String })
  lineId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product' })
  skuId?: MongooseSchema.Types.ObjectId;

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
  @Prop({ type: String, index: true })
  code?: string;

  @Prop({ type: String, enum: ReceiptType, default: ReceiptType.MANUAL })
  type: ReceiptType;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
    index: true,
  })
  warehouseId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, index: true })
  poId?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  supplierId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  supplier?: string;

  @Prop({ type: String })
  shippingParty?: string;

  @Prop({ type: Date })
  expectedReceiptAt?: Date;

  @Prop({ type: Date })
  actualReceiptAt?: Date;

  @Prop({ type: [ReferenceDocSchema], default: [] })
  referenceDocs: ReferenceDoc[];

  @Prop({
    type: String,
    enum: ReceiptStatus,
    default: ReceiptStatus.DRAFT,
    index: true,
  })
  status: ReceiptStatus;

  @Prop({ type: [ReceiptLineSchema], default: [] })
  lines: ReceiptLine[];

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  reviewers: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  rejectedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  rejectedAt?: Date;

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  lockedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  lockedAt?: Date;

  @Prop({ type: [AuditEntrySchema], default: [] })
  auditTrail: AuditEntry[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: MongooseSchema.Types.ObjectId;

  /** Reference to the ApprovalRequest in the approval-flow service */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ApprovalRequest',
    index: true,
  })
  approvalRequestId?: MongooseSchema.Types.ObjectId;

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
