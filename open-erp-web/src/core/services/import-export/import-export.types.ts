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

export enum ExportScope {
  GLOBAL = 'global',
  ORG = 'org',
}

export interface EntityField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  example?: any;
}

export interface EntityTemplate {
  entity: string;
  label: string;
  fields: EntityField[];
}

export interface JobError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ImportExportJob {
  _id: string;
  type: JobType;
  status: JobStatus;
  entity: string;
  format?: ExportFormat;
  exportMode?: ExportMode;
  importMode?: ImportMode;
  totalRows: number;
  processedRows: number;
  createdRows: number;
  updatedRows: number;
  failedRows: number;
  downloadUrl?: string;
  errorReportUrl?: string;
  errorMessage?: string;
  sampleErrors?: JobError[];
  originalFileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MappingTemplate {
  _id: string;
  name: string;
  entity: string;
  mapping: Record<string, string>;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateExportJobDto {
  entity: string;
  format?: ExportFormat;
  exportMode?: ExportMode;
  filters?: Record<string, any>;
  orgId?: string;
  scope?: ExportScope;
}

export interface CreateImportJobDto {
  entity: string;
  importMode?: ImportMode;
  mapping?: Record<string, string>;
  orgId?: string;
  dryRun?: boolean;
}

export interface SaveMappingTemplateDto {
  name: string;
  entity: string;
  mapping: Record<string, string>;
  orgId?: string;
  isDefault?: boolean;
}
