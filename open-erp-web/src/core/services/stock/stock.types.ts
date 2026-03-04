// ===== Stock interfaces =====

export interface StockProductSnapshot {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

export interface StockLotInfo {
  lotNumber: string;
  manufactureDate?: string;
  expiryDate?: string;
  quantity: number;
  costPerUnit?: number;
}

export interface InventoryStock {
  id: string;
  productId: string;
  productSnapshot: StockProductSnapshot;
  warehouseId: string;
  organizationId?: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  inTransitQuantity: number;
  totalQuantity?: number;
  lots: StockLotInfo[];
  valuationMethod: string;
  averageCost: number;
  totalValue: number;
  zone?: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  location?: string;
  lastMovementDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockSummary {
  warehouseId: string;
  totalSkus: number;
  totalAvailable: number;
  totalReserved: number;
  totalDamaged: number;
  totalInTransit: number;
  totalOnHand: number;
}

// ===== Lot interfaces =====

export interface Lot {
  id: string;
  skuId: string;
  lotCode: string;
  organizationId?: string;
  manufacturedAt?: string;
  expiryAt?: string;
  totalQty: number;
  remainingQty: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLotDto {
  skuId: string;
  lotCode: string;
  organizationId?: string;
  manufacturedAt?: string;
  expiryAt?: string;
  totalQty?: number;
  remainingQty?: number;
}

export interface UpdateLotDto {
  lotCode?: string;
  manufacturedAt?: string;
  expiryAt?: string;
  totalQty?: number;
  remainingQty?: number;
}

// ===== Serial interfaces =====

export type SerialStatus = 'available' | 'reserved' | 'in-transit' | 'consumed';

export interface Serial {
  id: string;
  skuId: string;
  serial: string;
  status: SerialStatus;
  binId?: string;
  lotId?: string;
  organizationId?: string;
  assignedAt?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSerialDto {
  skuId: string;
  serial: string;
  organizationId?: string;
  binId?: string;
  lotId?: string;
}

export interface UpdateSerialDto {
  status?: SerialStatus;
  binId?: string;
  lotId?: string;
}

// ===== Transaction interfaces =====

export interface InventoryTransaction {
  id: string;
  transactionNumber: string;
  type: string;
  status: string;
  productId: string;
  productSnapshot: StockProductSnapshot;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  stockBefore?: number;
  stockAfter?: number;
  notes?: string;
  reason?: string;
  transactionDate: string;
  createdAt?: string;
}
