import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SerialService } from '../src/services/serial.service';
import { SerialRepository } from '../src/repositories/serial.repository';
import { SerialStatus } from '@shared/schemas';

describe('SerialService', () => {
  let service: SerialService;
  let repository: SerialRepository;

  const mockSerial = {
    _id: '507f1f77bcf86cd799439011',
    skuId: '507f1f77bcf86cd799439022',
    serial: 'SN-2024-00001',
    status: SerialStatus.AVAILABLE,
    binId: '507f1f77bcf86cd799439033',
    lotId: null,
    assignedAt: new Date(),
    deletedAt: null,
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
        SerialService,
        {
          provide: SerialRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SerialService>(SerialService);
    repository = module.get<SerialRepository>(SerialRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should register a new serial', async () => {
      mockRepository.create.mockResolvedValue(mockSerial);

      const result = await service.create({
        skuId: '507f1f77bcf86cd799439022',
        serial: 'SN-2024-00001',
        binId: '507f1f77bcf86cd799439033',
      });

      expect(result).toEqual(mockSerial);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          serial: 'SN-2024-00001',
          status: SerialStatus.AVAILABLE,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return serial if found', async () => {
      mockRepository.findById.mockResolvedValue(mockSerial);

      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockSerial);
    });

    it('should throw NotFoundException if serial not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update serial status', async () => {
      const updatedSerial = { ...mockSerial, status: SerialStatus.RESERVED };
      mockRepository.update.mockResolvedValue(updatedSerial);

      const result = await service.update('507f1f77bcf86cd799439011', {
        status: SerialStatus.RESERVED,
      });

      expect(result.status).toBe(SerialStatus.RESERVED);
    });

    it('should throw NotFoundException when updating non-existent serial', async () => {
      mockRepository.update.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { status: SerialStatus.CONSUMED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySkuId', () => {
    it('should return paginated serials for a SKU', async () => {
      mockRepository.findBySkuId.mockResolvedValue({
        items: [mockSerial],
        total: 1,
      });

      const result = await service.findBySkuId('507f1f77bcf86cd799439022', {
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockRepository.findBySkuId.mockResolvedValue({
        items: [mockSerial],
        total: 1,
      });

      await service.findBySkuId('507f1f77bcf86cd799439022', {
        status: SerialStatus.AVAILABLE,
      });

      expect(mockRepository.findBySkuId).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022',
        expect.objectContaining({ status: SerialStatus.AVAILABLE }),
      );
    });

    it('should filter by binId', async () => {
      mockRepository.findBySkuId.mockResolvedValue({
        items: [mockSerial],
        total: 1,
      });

      await service.findBySkuId('507f1f77bcf86cd799439022', {
        binId: '507f1f77bcf86cd799439033',
      });

      expect(mockRepository.findBySkuId).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022',
        expect.objectContaining({ binId: '507f1f77bcf86cd799439033' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all serials with pagination', async () => {
      mockRepository.findAll.mockResolvedValue({
        items: [mockSerial],
        total: 1,
      });

      const result = await service.findAll({}, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });
});
