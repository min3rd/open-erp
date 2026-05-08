import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TransferService, TransferStatus } from '../src/services/transfer.service';
import { WmsStockRepository } from '../src/repositories/stock.repository';
import { WmsTransactionRepository } from '../src/repositories/transaction.repository';
import { RABBITMQ_WMS_CLIENT } from '../src/constants/rabbitmq.constants';
import { InventoryTransactionType, TransactionStatus } from '@shared/constants';
import { CreateTransferDto } from '../src/dto/transfer.dto';

const TENANT_A = 'tenant_A';

const mockStockRepo = {
  upsertStock: jest.fn(),
};

const mockTxRepo = {
  createWithSession: jest.fn(),
  findByTenant: jest.fn(),
  updateStatus: jest.fn(),
};

const mockRabbit = {
  emit: jest.fn(),
};

const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

const mockConnection = {
  startSession: jest.fn().mockResolvedValue(mockSession),
};

const sampleDto: CreateTransferDto = {
  fromWarehouseId: 'wh_source',
  toWarehouseId: 'wh_dest',
  lines: [{ sku: 'p1', qty: 5 }],
};

describe('TransferService', () => {
  let service: TransferService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: WmsStockRepository, useValue: mockStockRepo },
        { provide: WmsTransactionRepository, useValue: mockTxRepo },
        { provide: RABBITMQ_WMS_CLIENT, useValue: mockRabbit },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
  });

  describe('createTransfer', () => {
    it('should create PENDING transactions for each line', async () => {
      mockTxRepo.createWithSession.mockResolvedValue({ _id: 'tx1' });

      const result = await service.createTransfer(TENANT_A, sampleDto, 'user1');

      expect(mockTxRepo.createWithSession).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_A,
          type: InventoryTransactionType.TRANSFER,
          status: TransactionStatus.PENDING,
          sourceWarehouseId: 'wh_source',
          destinationWarehouseId: 'wh_dest',
          quantity: 5,
        }),
      );
      expect(result.status).toBe(TransferStatus.PENDING);
      expect(result.transferId).toMatch(/^TRF-/);
    });

    it('should reject when fromWarehouseId === toWarehouseId', async () => {
      const sameWh: CreateTransferDto = {
        fromWarehouseId: 'wh1',
        toWarehouseId: 'wh1',
        lines: [{ sku: 'p1', qty: 1 }],
      };

      await expect(service.createTransfer(TENANT_A, sameWh, 'user1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirmTransfer', () => {
    const pendingTxs = [
      {
        _id: { toString: () => 'tx1' },
        productId: { toString: () => 'p1' },
        sourceWarehouseId: { toString: () => 'wh_source' },
        destinationWarehouseId: { toString: () => 'wh_dest' },
        quantity: 5,
      },
    ];

    it('should deduct source, add destination atomically, mark COMPLETED', async () => {
      mockTxRepo.findByTenant.mockResolvedValue({ items: pendingTxs });
      mockStockRepo.upsertStock.mockResolvedValue({});
      mockTxRepo.updateStatus.mockResolvedValue({});

      const result = await service.confirmTransfer(TENANT_A, 'TRF-001', 'user1');

      // Deduct from source
      expect(mockStockRepo.upsertStock).toHaveBeenCalledWith(
        TENANT_A,
        'p1',
        'wh_source',
        -5,
        mockSession,
      );
      // Add to destination
      expect(mockStockRepo.upsertStock).toHaveBeenCalledWith(
        TENANT_A,
        'p1',
        'wh_dest',
        5,
        mockSession,
      );
      expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(TransferStatus.CONFIRMED);
    });

    it('should emit TRANSFER_COMPLETED event on success', async () => {
      mockTxRepo.findByTenant.mockResolvedValue({ items: pendingTxs });
      mockStockRepo.upsertStock.mockResolvedValue({});
      mockTxRepo.updateStatus.mockResolvedValue({});

      await service.confirmTransfer(TENANT_A, 'TRF-001', 'user1');

      expect(mockRabbit.emit).toHaveBeenCalledWith(
        'erp.wms.transfer.completed.v1',
        expect.objectContaining({ tenant_id: TENANT_A }),
      );
    });

    it('should rollback and mark transactions FAILED when upsertStock throws', async () => {
      mockTxRepo.findByTenant.mockResolvedValue({ items: pendingTxs });
      mockStockRepo.upsertStock.mockRejectedValue(new Error('DB error'));
      mockTxRepo.updateStatus.mockResolvedValue({});

      await expect(
        service.confirmTransfer(TENANT_A, 'TRF-001', 'user1'),
      ).rejects.toThrow('DB error');

      expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      // Mark as FAILED (best-effort)
      expect(mockTxRepo.updateStatus).toHaveBeenCalledWith(
        'tx1',
        TENANT_A,
        TransactionStatus.FAILED,
      );
    });

    it('should throw NotFoundException when no pending transfer found', async () => {
      mockTxRepo.findByTenant.mockResolvedValue({ items: [] });

      await expect(
        service.confirmTransfer(TENANT_A, 'TRF-NOT-EXIST', 'user1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransfers', () => {
    it('should filter transfers by tenantId only (cross-tenant isolation)', async () => {
      mockTxRepo.findByTenant.mockResolvedValue({ items: [], total: 0 });

      await service.getTransfers(TENANT_A, { page: 1, limit: 10 });

      const [calledTenantId] = mockTxRepo.findByTenant.mock.calls[0];
      expect(calledTenantId).toBe(TENANT_A);
    });
  });
});
