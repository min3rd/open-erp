import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { StockService } from '../src/services/stock.service';
import { WmsStockRepository } from '../src/repositories/stock.repository';
import { WmsTransactionRepository } from '../src/repositories/transaction.repository';
import { RABBITMQ_WMS_CLIENT } from '../src/constants/rabbitmq.constants';
import { InventoryTransactionType } from '@shared/constants';
import { AdjustStockDto, StockQueryDto } from '../src/dto/stock.dto';

const TENANT_A = 'tenant_A';
const TENANT_B = 'tenant_B';

const mockStockRepo = {
  findByTenant: jest.fn(),
  upsertStock: jest.fn(),
};

const mockTxRepo = {
  createWithSession: jest.fn(),
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

describe('StockService', () => {
  let service: StockService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: WmsStockRepository, useValue: mockStockRepo },
        { provide: WmsTransactionRepository, useValue: mockTxRepo },
        { provide: RABBITMQ_WMS_CLIENT, useValue: mockRabbit },
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  describe('getStock', () => {
    it('should return paginated stock filtered by tenantId', async () => {
      const items = [{ productId: 'p1', tenantId: TENANT_A }];
      mockStockRepo.findByTenant.mockResolvedValue({ items, total: 1 });

      const query: StockQueryDto = { page: 1, limit: 10 };
      const result = await service.getStock(TENANT_A, query);

      expect(mockStockRepo.findByTenant).toHaveBeenCalledWith(
        TENANT_A,
        expect.any(Object),
        { skip: 0, limit: 10 },
      );
      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
    });

    it('should always pass tenantId to repository (cross-tenant isolation)', async () => {
      mockStockRepo.findByTenant.mockResolvedValue({ items: [], total: 0 });

      await service.getStock(TENANT_B, {});

      const [calledTenantId] = mockStockRepo.findByTenant.mock.calls[0];
      expect(calledTenantId).toBe(TENANT_B);
    });

    it('should forward warehouse filter correctly', async () => {
      mockStockRepo.findByTenant.mockResolvedValue({ items: [], total: 0 });

      await service.getStock(TENANT_A, { warehouseId: 'wh1', page: 2, limit: 5 });

      expect(mockStockRepo.findByTenant).toHaveBeenCalledWith(
        TENANT_A,
        expect.objectContaining({ warehouseId: 'wh1' }),
        { skip: 5, limit: 5 },
      );
    });
  });

  describe('adjustStock', () => {
    const dto: AdjustStockDto = {
      type: InventoryTransactionType.ADJUSTMENT,
      reason: 'cycle count',
      lines: [
        { productId: 'p1', warehouseId: 'wh1', qtyDelta: 10 },
      ],
    };

    it('should upsertStock and createTransaction per line, then commit', async () => {
      mockStockRepo.upsertStock.mockResolvedValue({});
      mockTxRepo.createWithSession.mockResolvedValue({});

      await service.adjustStock(TENANT_A, dto, 'user1');

      expect(mockSession.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockStockRepo.upsertStock).toHaveBeenCalledWith(
        TENANT_A,
        'p1',
        'wh1',
        10,
        mockSession,
      );
      expect(mockTxRepo.createWithSession).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A, productId: 'p1' }),
        mockSession,
      );
      expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();
    });

    it('should emit STOCK_MOVED event after successful adjust', async () => {
      mockStockRepo.upsertStock.mockResolvedValue({});
      mockTxRepo.createWithSession.mockResolvedValue({});

      await service.adjustStock(TENANT_A, dto, 'user1');

      expect(mockRabbit.emit).toHaveBeenCalledWith(
        'erp.wms.stock.moved.v1',
        expect.objectContaining({ tenant_id: TENANT_A }),
      );
    });

    it('should rollback transaction when upsertStock throws', async () => {
      mockStockRepo.upsertStock.mockRejectedValue(new Error('DB error'));

      await expect(service.adjustStock(TENANT_A, dto, 'user1')).rejects.toThrow('DB error');

      expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockRabbit.emit).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when productId is missing', async () => {
      const badDto: AdjustStockDto = {
        type: InventoryTransactionType.ADJUSTMENT,
        lines: [{ productId: '', warehouseId: 'wh1', qtyDelta: 5 }],
      };

      await expect(service.adjustStock(TENANT_A, badDto, 'user1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
