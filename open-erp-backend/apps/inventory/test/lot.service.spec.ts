import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LotService } from '../src/services/lot.service';
import { LotRepository } from '../src/repositories/lot.repository';

describe('LotService', () => {
  let service: LotService;
  let repository: LotRepository;

  const mockLot = {
    _id: '507f1f77bcf86cd799439011',
    skuId: '507f1f77bcf86cd799439022',
    lotCode: 'LOT-2024-001',
    totalQty: 100,
    remainingQty: 80,
    manufacturedAt: new Date('2024-01-01'),
    expiryAt: new Date('2025-12-31'),
    deletedAt: null,
  };

  const mockExpiredLot = {
    ...mockLot,
    _id: '507f1f77bcf86cd799439033',
    lotCode: 'LOT-2023-EXPIRED',
    expiryAt: new Date('2023-01-01'),
  };

  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findBySkuId: jest.fn(),
    findAll: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LotService,
        {
          provide: LotRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LotService>(LotService);
    repository = module.get<LotRepository>(LotRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a lot with valid data', async () => {
      mockRepository.create.mockResolvedValue(mockLot);

      const result = await service.create({
        skuId: '507f1f77bcf86cd799439022',
        lotCode: 'LOT-2024-001',
        totalQty: 100,
        remainingQty: 80,
        manufacturedAt: '2024-01-01',
        expiryAt: '2025-12-31',
      });

      expect(result).toEqual(mockLot);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lotCode: 'LOT-2024-001',
          totalQty: 100,
          remainingQty: 80,
        }),
      );
    });

    it('should default remainingQty to totalQty when not provided', async () => {
      mockRepository.create.mockResolvedValue(mockLot);

      await service.create({
        skuId: '507f1f77bcf86cd799439022',
        lotCode: 'LOT-2024-002',
        totalQty: 50,
      });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalQty: 50,
          remainingQty: 50,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return lot if found', async () => {
      mockRepository.findById.mockResolvedValue(mockLot);

      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockLot);
    });

    it('should throw NotFoundException if lot not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.findById('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update lot fields', async () => {
      const updatedLot = { ...mockLot, remainingQty: 50 };
      mockRepository.update.mockResolvedValue(updatedLot);

      const result = await service.update('507f1f77bcf86cd799439011', {
        remainingQty: 50,
      });

      expect(result.remainingQty).toBe(50);
    });

    it('should throw NotFoundException when updating non-existent lot', async () => {
      mockRepository.update.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { remainingQty: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateNotExpired', () => {
    it('should return lot if not expired', async () => {
      const futureLot = {
        ...mockLot,
        expiryAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
      mockRepository.findById.mockResolvedValue(futureLot);

      const result = await service.validateNotExpired('507f1f77bcf86cd799439011');
      expect(result).toEqual(futureLot);
    });

    it('should throw BadRequestException if lot is expired', async () => {
      mockRepository.findById.mockResolvedValue(mockExpiredLot);

      await expect(
        service.validateNotExpired('507f1f77bcf86cd799439033'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return lot if no expiry date set', async () => {
      const noExpiryLot = { ...mockLot, expiryAt: null };
      mockRepository.findById.mockResolvedValue(noExpiryLot);

      const result = await service.validateNotExpired('507f1f77bcf86cd799439011');
      expect(result).toEqual(noExpiryLot);
    });
  });

  describe('findBySkuId', () => {
    it('should return paginated lots for a SKU', async () => {
      mockRepository.findBySkuId.mockResolvedValue({
        items: [mockLot],
        total: 1,
      });

      const result = await service.findBySkuId('507f1f77bcf86cd799439022', {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by expired status', async () => {
      mockRepository.findBySkuId.mockResolvedValue({
        items: [mockExpiredLot],
        total: 1,
      });

      const result = await service.findBySkuId('507f1f77bcf86cd799439022', {
        expired: true,
      });

      expect(mockRepository.findBySkuId).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022',
        expect.objectContaining({ expired: true }),
      );
      expect(result.items).toHaveLength(1);
    });
  });
});
