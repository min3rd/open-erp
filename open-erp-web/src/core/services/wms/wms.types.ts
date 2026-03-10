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

export interface AuditEntry {
  action: string;
  userId?: string;
  timestamp: string;
  ip?: string;
  payload?: any;
}

export interface MinioObject {
  fileKey: string;
  fileBucket?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  publicUrl?: string;
}

export interface ReferenceDoc {
  type: string;
  refId?: string;
  url?: string;
  /** Attached file (uploaded to MinIO) */
  attachment?: MinioObject;
  /** Receipt line IDs this document relates to */
  lineIds?: string[];
}

export interface ReceiptLine {
  lineId?: string;
  skuId: string;
  skuCode?: string;
  skuName?: string;
  orderedQty: number;
  receivedQty: number;
  unit?: string;
  lotId?: string;
  serials: string[];
  qcStatus: QcStatus;
  qcNotes?: string;
  defectQty: number;
  quarantineBin?: string;
}

export interface Receipt {
  id: string;
  code?: string;
  type: ReceiptType;
  orgId: string;
  warehouseId: string;
  poId?: string;
  supplierId?: string;
  supplier?: string;
  shippingParty?: string;
  expectedReceiptAt?: string;
  actualReceiptAt?: string;
  referenceDocs: ReferenceDoc[];
  status: ReceiptStatus;
  lines: ReceiptLine[];
  notes?: string;
  attachments: string[];
  reviewers: string[];
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  lockedBy?: string;
  lockedAt?: string;
  auditTrail: AuditEntry[];
  createdBy?: string;
  receivedBy?: string;
  receivedAt?: string;
  approvalRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceiptLineDto {
  skuId: string;
  skuCode?: string;
  skuName?: string;
  orderedQty: number;
  unit?: string;
}

export interface CreateReceiptDto {
  orgId: string;
  warehouseId: string;
  type?: ReceiptType;
  poId?: string;
  supplierId?: string;
  supplier?: string;
  shippingParty?: string;
  expectedReceiptAt?: string;
  referenceDocs?: ReferenceDoc[];
  notes?: string;
  lines?: CreateReceiptLineDto[];
}

export interface UpdateReceiptDto {
  type?: ReceiptType;
  poId?: string;
  supplier?: string;
  shippingParty?: string;
  expectedReceiptAt?: string;
  referenceDocs?: ReferenceDoc[];
  notes?: string;
  lines?: CreateReceiptLineDto[];
}

export interface SubmitReceiptDto {
  reviewers?: string[];
  notes?: string;
}

export interface ReviewReceiptDto {
  action: 'accept' | 'reject';
  notes?: string;
  lineQcResults?: { lineIndex: number; qcStatus: QcStatus; qcNotes?: string; defectQty?: number }[];
}

export interface ApproveReceiptDto {
  notes?: string;
}

export interface ReceiveLineDto {
  lineId?: string;
  skuId: string;
  receivedQty: number;
  lotId?: string;
  serials?: string[];
}

export interface ReceiveReceiptDto {
  lines: ReceiveLineDto[];
  actualReceiptAt?: string;
  partial?: boolean;
}

export interface FinalizeReceiptDto {
  notes?: string;
}

export interface UnlockReceiptDto {
  reason: string;
}

export interface QcReceiptDto {
  qcStatus: QcStatus;
  qcNotes?: string;
  defectQty?: number;
  quarantineBin?: string;
  lineIndex?: number;
}

// Picklists
export enum PicklistStatus {
  DRAFT = 'draft',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PARTIAL = 'partial',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface PicklistLine {
  skuId: string;
  skuCode?: string;
  skuName?: string;
  qty: number;
  pickedQty: number;
  unit?: string;
  bins: string[];
  serials: string[];
  lotId?: string;
}

export interface Picklist {
  id: string;
  orgId: string;
  warehouseId: string;
  orderIds: string[];
  status: PicklistStatus;
  lines: PicklistLine[];
  notes?: string;
  assignedTo?: string;
  createdBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePicklistLineDto {
  skuId: string;
  skuCode?: string;
  skuName?: string;
  qty: number;
  unit?: string;
}

export interface CreatePicklistDto {
  orgId: string;
  warehouseId: string;
  orderIds?: string[];
  notes?: string;
  assignedTo?: string;
  lines?: CreatePicklistLineDto[];
}

export interface PickLineDto {
  skuId: string;
  pickedQty: number;
  bins?: string[];
  serials?: string[];
  lotId?: string;
}

export interface PickDto {
  picks: PickLineDto[];
}

// Packages
export enum WmsPackageStatus {
  OPEN = 'open',
  PACKED = 'packed',
  SHIPPED = 'shipped',
}

export interface WmsPackage {
  id: string;
  orgId: string;
  shipmentId?: string;
  picklistIds: string[];
  status: WmsPackageStatus;
  weight?: number;
  dimensions?: string;
  labels: string[];
  trackingNumber?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageDto {
  orgId: string;
  shipmentId?: string;
  picklistIds?: string[];
  weight?: number;
  dimensions?: string;
  notes?: string;
}

// Shipments
export enum ShipmentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PARTIAL = 'partial',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export interface Shipment {
  id: string;
  orgId: string;
  warehouseId: string;
  orderIds: string[];
  packageIds: string[];
  status: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  recipientName?: string;
  recipientAddress?: string;
  notes?: string;
  createdBy?: string;
  shippedBy?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentDto {
  orgId: string;
  warehouseId: string;
  orderIds?: string[];
  packageIds?: string[];
  carrier?: string;
  trackingNumber?: string;
  recipientName?: string;
  recipientAddress?: string;
  notes?: string;
}

export interface ShipShipmentDto {
  partial?: boolean;
  packageIds?: string[];
  trackingNumber?: string;
  carrier?: string;
}
