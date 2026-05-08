import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { WmsStockRepository } from '../repositories/stock.repository';
import { WmsTransactionRepository } from '../repositories/transaction.repository';
import { StockQueryDto, AdjustStockDto } from '../dto/stock.dto';
import { InventoryTransactionType, TransactionStatus } from '@shared/constants';
import { RABBITMQ_WMS_CLIENT, WMS_EVENTS } from '../constants/rabbitmq.constants';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly stockRepository: WmsStockRepository,
    private readonly transactionRepository: WmsTransactionRepository,
    @Inject(RABBITMQ_WMS_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async getStock(tenantId: string, query: StockQueryDto) {
    const { page = 1, limit = 20, warehouseId, productId, sku, q } = query;
    const skip = (page - 1) * limit;

    const { items, total } = await this.stockRepository.findByTenant(
      tenantId,
      { warehouseId, productId, sku, q },
      { skip, limit },
    );

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adjustStock(
    tenantId: string,
    dto: AdjustStockDto,
    userId: string,
  ): Promise<void> {
    this.logger.log(
      `[WMS] Tenant ${tenantId} — adjustStock type=${dto.type} lines=${dto.lines.length}`,
    );

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      for (const line of dto.lines) {
        // Tenant isolation: block nếu productId/warehouseId không thuộc tenant này
        // (trong thực tế có thể kiểm tra qua product repository — đây là guard cơ bản)
        if (!line.productId || !line.warehouseId) {
          throw new ForbiddenException('productId and warehouseId are required');
        }

        await this.stockRepository.upsertStock(
          tenantId,
          line.productId,
          line.warehouseId,
          line.qtyDelta,
          session,
        );

        await this.transactionRepository.createWithSession(
          {
            tenantId,
            type: dto.type ?? InventoryTransactionType.ADJUSTMENT,
            status: TransactionStatus.COMPLETED,
            productId: line.productId,
            sourceWarehouseId:
              dto.type === InventoryTransactionType.OUT ||
              dto.type === InventoryTransactionType.TRANSFER
                ? line.warehouseId
                : undefined,
            destinationWarehouseId:
              dto.type === InventoryTransactionType.IN
                ? line.warehouseId
                : undefined,
            quantity: Math.abs(line.qtyDelta),
            reason: dto.reason,
            createdById: userId,
            lotNumber: line.lotNumber,
          },
          session,
        );
      }

      await session.commitTransaction();

      this.rabbitClient.emit(WMS_EVENTS.STOCK_MOVED, {
        event_id: crypto.randomUUID(),
        event_type: WMS_EVENTS.STOCK_MOVED,
        occurred_at: new Date().toISOString(),
        tenant_id: tenantId,
        source: 'wms-service',
        data: { type: dto.type, lines: dto.lines, adjustedBy: userId },
      });
    } catch (err) {
      await session.abortTransaction();
      this.logger.error(`[WMS] adjustStock rollback — ${err.message}`, err.stack);
      throw err;
    } finally {
      await session.endSession();
    }
  }
}
