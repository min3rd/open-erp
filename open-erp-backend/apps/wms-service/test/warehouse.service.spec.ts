import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WmsWarehouseService } from '../src/services/warehouse.service';
import { WmsWarehouseRepository } from '../src/repositories/warehouse.repository';
import { CreateWarehouseDto, UpdateWarehouseDto, QueryWarehouseDto } from '../src/dto/warehouse.dto';

const TENANT_A = 'tenant_A';
const TENANT_B = 'tenant_B';
const USER_ID = 'user_001';

const mockWarehouseRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  provinceExists: jest.fn(),
  getWard: jest.fn(),
  getAllProvinces: jest.fn(),
  getWardsByProvince: jest.fn(),
};

describe('WmsWarehouseService', () => {
  let service: WmsWarehouseService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WmsWarehouseService,
        { provide: WmsWarehouseRepository, useValue: mockWarehouseRepo },
      ],
    }).compile();

    service = module.get<WmsWarehouseService>(WmsWarehouseService);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // create
  // ────────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a warehouse with tenantId injected', async () => {
      const dto: CreateWarehouseDto = { name: 'Kho A', code: 'WH-001' };
      const expected = { _id: 'wh1', ...dto, tenantId: TENANT_A };

      mockWarehouseRepo.provinceExists.mockResolvedValue(true);
      mockWarehouseRepo.findByCode.mockResolvedValue(null);
      mockWarehouseRepo.create.mockResolvedValue(expected);

      const result = await service.create(dto, USER_ID, TENANT_A);

      expect(mockWarehouseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'WH-001', tenantId: TENANT_A }),
        USER_ID,
      );
      expect(result).toEqual(expected);
    });

    it('should throw ConflictException when warehouse code already exists', async () => {
      const dto: CreateWarehouseDto = { name: 'Kho B', code: 'WH-DUP' };

      mockWarehouseRepo.findByCode.mockResolvedValue({ _id: 'existing' });

      await expect(service.create(dto, USER_ID, TENANT_A)).rejects.toThrow(
        ConflictException,
      );
      expect(mockWarehouseRepo.create).not.toHaveBeenCalled();
    });

    it('should auto-generate code when code is omitted', async () => {
      const dto: CreateWarehouseDto = { name: 'Kho Auto' };
      mockWarehouseRepo.findByCode.mockResolvedValue(null);
      mockWarehouseRepo.create.mockResolvedValue({ _id: 'wh2', name: 'Kho Auto' });

      await service.create(dto, USER_ID, TENANT_A);

      expect(mockWarehouseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Kho Auto', tenantId: TENANT_A }),
        USER_ID,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findAll
  // ────────────────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should pass tenantId to repository (tenant isolation)', async () => {
      const items = [{ _id: 'wh1', tenantId: TENANT_A }];
      mockWarehouseRepo.findAll.mockResolvedValue({ items, total: 1, page: 1, limit: 10 });

      const query: QueryWarehouseDto = {};
      await service.findAll(query, TENANT_A);

      expect(mockWarehouseRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A }),
      );
    });

    it('should NOT return data from another tenant (cross-tenant isolation)', async () => {
      mockWarehouseRepo.findAll.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });

      await service.findAll({}, TENANT_B);

      const [calledQuery] = mockWarehouseRepo.findAll.mock.calls[0];
      expect(calledQuery.tenantId).toBe(TENANT_B);
      expect(calledQuery.tenantId).not.toBe(TENANT_A);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findById
  // ────────────────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return warehouse when it belongs to the tenant', async () => {
      const warehouse = { _id: 'wh1', tenantId: TENANT_A };
      mockWarehouseRepo.findById.mockResolvedValue(warehouse);

      const result = await service.findById('wh1', TENANT_A);
      expect(result).toEqual(warehouse);
    });

    it('should throw NotFoundException when warehouse does not exist', async () => {
      mockWarehouseRepo.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent', TENANT_A)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when warehouse belongs to another tenant', async () => {
      mockWarehouseRepo.findById.mockResolvedValue({ _id: 'wh1', tenantId: TENANT_B });

      await expect(service.findById('wh1', TENANT_A)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // update
  // ────────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update warehouse with correct tenant', async () => {
      const existing = { _id: 'wh1', tenantId: TENANT_A, code: 'WH-001' };
      const updatedDto: UpdateWarehouseDto = { name: 'Kho A Updated' };
      const updated = { ...existing, name: 'Kho A Updated' };

      mockWarehouseRepo.findById.mockResolvedValue(existing);
      mockWarehouseRepo.update.mockResolvedValue(updated);

      const result = await service.update('wh1', updatedDto, USER_ID, TENANT_A);
      expect(result).toEqual(updated);
      expect(mockWarehouseRepo.update).toHaveBeenCalledWith('wh1', updatedDto, USER_ID);
    });

    it('should throw NotFoundException when warehouse not found for update', async () => {
      mockWarehouseRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('bad-id', { name: 'X' }, USER_ID, TENANT_A),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // softDelete
  // ────────────────────────────────────────────────────────────────────────────
  describe('softDelete', () => {
    it('should soft delete warehouse owned by tenant', async () => {
      const existing = { _id: 'wh1', tenantId: TENANT_A };
      mockWarehouseRepo.findById.mockResolvedValue(existing);
      mockWarehouseRepo.softDelete.mockResolvedValue({ ...existing, deletedAt: new Date() });

      await expect(service.softDelete('wh1', TENANT_A)).resolves.not.toThrow();
      expect(mockWarehouseRepo.softDelete).toHaveBeenCalledWith('wh1');
    });

    it('should throw NotFoundException when warehouse not found for delete', async () => {
      mockWarehouseRepo.findById.mockResolvedValue(null);

      await expect(service.softDelete('bad-id', TENANT_A)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
