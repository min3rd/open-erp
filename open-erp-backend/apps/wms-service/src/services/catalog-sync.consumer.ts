import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PLATFORM_EVENTS } from '../constants/rabbitmq.constants';

interface CatalogItemUpdatedPayload {
  tenant_id: string;
  data: {
    productId: string;
    sku: string;
    name: string;
    unit: string;
  };
}

@Injectable()
export class CatalogSyncConsumer {
  private readonly logger = new Logger(CatalogSyncConsumer.name);

  @EventPattern(PLATFORM_EVENTS.CATALOG_ITEM_UPDATED)
  handleCatalogItemUpdated(@Payload() payload: CatalogItemUpdatedPayload) {
    this.logger.log(
      `[WMS] Received catalog update for tenant=${payload.tenant_id} product=${payload.data?.productId}`,
    );
    // TODO Sprint-03: sync product snapshot in inventory_stock collection
  }
}
