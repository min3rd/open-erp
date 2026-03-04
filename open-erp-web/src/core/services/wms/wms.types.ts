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

export interface ReceiptLine {
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
  orgId: string;
  warehouseId: string;
  poId?: string;
  supplier?: string;
  status: ReceiptStatus;
  lines: ReceiptLine[];
  notes?: string;
  attachments: string[];
  createdBy?: string;
  receivedBy?: string;
  receivedAt?: string;
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
  poId?: string;
  supplier?: string;
  notes?: string;
  lines?: CreateReceiptLineDto[];
}

export interface ReceiveLineDto {
  skuId: string;
  receivedQty: number;
  lotId?: string;
  serials?: string[];
}

export interface ReceiveReceiptDto {
  lines: ReceiveLineDto[];
  partial?: boolean;
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
