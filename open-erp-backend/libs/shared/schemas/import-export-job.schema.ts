import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ImportExportJobDocument = ImportExportJob & Document;

export enum JobType {
  EXPORT = 'export',
  IMPORT = 'import',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ExportFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
}

export enum ExportMode {
  FLAT = 'flat',
  RELATIONAL = 'relational',
}

export enum ImportMode {
  CREATE_ONLY = 'create_only',
  UPSERT = 'upsert',
  UPDATE_ONLY = 'update_only',
}

@Schema({
  collection: 'import_export_jobs',
  timestamps: true,
  versionKey: false,
})
export class ImportExportJob {
  @Prop({ required: true, enum: JobType })
  type: JobType;

  @Prop({ required: true, enum: JobStatus, default: JobStatus.PENDING })
  status: JobStatus;

  @Prop({ required: true })
  entity: string;

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  orgId?: Types.ObjectId;

  @Prop({ type: Object })
  filters?: Record<string, any>;

  @Prop({ enum: ExportFormat })
  format?: ExportFormat;

  @Prop({ enum: ExportMode, default: ExportMode.FLAT })
  exportMode?: ExportMode;

  @Prop({ enum: ImportMode })
  importMode?: ImportMode;

  @Prop({ type: Object })
  mapping?: Record<string, string>;

  @Prop({ default: 0 })
  totalRows: number;

  @Prop({ default: 0 })
  processedRows: number;

  @Prop({ default: 0 })
  createdRows: number;

  @Prop({ default: 0 })
  updatedRows: number;

  @Prop({ default: 0 })
  failedRows: number;

  @Prop()
  downloadUrl?: string;

  @Prop()
  fileBucket?: string;

  @Prop()
  errorReportUrl?: string;

  @Prop()
  errorMessage?: string;

  @Prop({ type: [Object], default: [] })
  sampleErrors?: Array<{
    row: number;
    field: string;
    message: string;
    value?: any;
  }>;

  @Prop()
  originalFileName?: string;

  @Prop()
  fileKey?: string;
}

export const ImportExportJobSchema =
  SchemaFactory.createForClass(ImportExportJob);
