import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { WmsStockRepository } from '../repositories/stock.repository';
import { WmsTransactionRepository } from '../repositories/transaction.repository';
import { CreateTransferDto, TransferQueryDto } from '../dto/transfer.dto';
import { InventoryTransactionType, TransactionStatus } from '@shared/constants';
import { RABBITMQ_WMS_CLIENT, WMS_EVENTS } from '../constants/rabbitmq.constants';

export enum TransferStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly stockRepository: WmsStockRepository,
    private readonly transactionRepository: WmsTransactionRepository,
    @Inject(RABBITMQ_WMS_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async createTransfer(
    tenantId: string,
    dto: CreateTransferDto,
    userId: string,
  ) {
    this.logger.log(
      `[WMS] Tenant ${tenantId} — createTransfer from=${dto.fromWarehouseId} to=${dto.toWarehouseId}`,
    );

    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouse must be different',
      );
    }

    const refNo = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    // Tạo transaction PENDING cho từng line (chưa trừ/cộng stock)
    const txIds: string[] = [];
    for (const line of dto.lines) {
      const tx = await this.transactionRepository.createWithSession({
        tenantId,
        type: InventoryTransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
        productId: line.sku, // sku được dùng như productId key ở đây — frontend gửi productId
        sourceWarehouseId: dto.fromWarehouseId,
        destinationWarehouseId: dto.toWarehouseId,
        quantity: line.qty,
        referenceNo: refNo,
        reason: dto.referenceNote,
        createdById: userId,
        lotNumber: line.lotNumber,
      });
      txIds.push((tx._id as object).toString());
    }

    return {
      transferId: refNo,
      status: TransferStatus.PENDING,
      transactionIds: txIds,
      lines: dto.lines,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
    };
  }

  async confirmTransfer(
    tenantId: string,
    referenceNo: string,
    userId: string,
  ) {
    this.logger.log(
      `[WMS] Tenant ${tenantId} — confirmTransfer ref=${referenceNo}`,
    );

    const { items: pendingTxs } =
      await this.transactionRepository.findByTenant(
        tenantId,
        {
          referenceNo,
          status: TransactionStatus.PENDING,
          type: InventoryTransactionType.TRANSFER,
        },
        { limit: 100 },
      );

    if (pendingTxs.length === 0) {
      throw new NotFoundException(
        `No pending transfer found with referenceNo=${referenceNo}`,
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      for (const tx of pendingTxs) {
        // Deduct from source
        await this.stockRepository.upsertStock(
          tenantId,
          tx.productId.toString(),
          tx.sourceWarehouseId!.toString(),
          -tx.quantity,
          session,
        );

        // Add to destination
        await this.stockRepository.upsertStock(
          tenantId,
          tx.productId.toString(),
          tx.destinationWarehouseId!.toString(),
          tx.quantity,
          session,
        );

        // Mark transaction COMPLETED
        await this.transactionRepository.updateStatus(
          tx._id.toString(),
          tenantId,
          TransactionStatus.COMPLETED,
          session,
        );
      }

      await session.commitTransaction();

      this.rabbitClient.emit(WMS_EVENTS.TRANSFER_COMPLETED, {
        event_id: crypto.randomUUID(),
        event_type: WMS_EVENTS.TRANSFER_COMPLETED,
        occurred_at: new Date().toISOString(),
        tenant_id: tenantId,
        source: 'wms-service',
        data: { referenceNo, confirmedBy: userId },
      });

      return { transferId: referenceNo, status: TransferStatus.CONFIRMED };
    } catch (err) {
      await session.abortTransaction();
      this.logger.error(
        `[WMS] confirmTransfer rollback ref=${referenceNo} — ${err.message}`,
        err.stack,
      );

      // Mark transactions as FAILED
      for (const tx of pendingTxs) {
        await this.transactionRepository.updateStatus(
          tx._id.toString(),
          tenantId,
          TransactionStatus.FAILED,
        ).catch(() => {
          /* best-effort */
        });
      }

      throw err;
    } finally {
      await session.endSession();
    }
  }

  async getTransfers(tenantId: string, query: TransferQueryDto) {
    const { page = 1, limit = 20, warehouseId, status } = query;
    const skip = (page - 1) * limit;

    const { items, total } = await this.transactionRepository.findByTenant(
      tenantId,
      {
        warehouseId,
        type: InventoryTransactionType.TRANSFER,
        status: status as TransactionStatus | undefined,
      },
      { skip, limit },
    );

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
