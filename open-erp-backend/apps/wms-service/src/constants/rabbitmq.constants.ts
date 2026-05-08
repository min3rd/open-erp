export const RABBITMQ_WMS_CLIENT = 'RABBITMQ_WMS_CLIENT';

export const WMS_EVENTS = {
  STOCK_MOVED: 'erp.wms.stock.moved.v1',
  TRANSFER_COMPLETED: 'erp.wms.transfer.completed.v1',
} as const;

export const PLATFORM_EVENTS = {
  CATALOG_ITEM_UPDATED: 'erp.platform.catalog.item.updated.v1',
} as const;
