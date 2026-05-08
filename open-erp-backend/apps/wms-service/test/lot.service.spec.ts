import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WmsLotService } from '../src/services/lot.service';
import { WmsLotRepository } from '../src/repositories/lot.repository';
import { CreateLotDto, UpdateLotDto, QueryLotDto } from '../src/dto/lot.dto';

const TENANT_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const SKU_ID = 'cccccccccccccccccccccccc';
const LOT_ID = 'dddddddddddddddddddddddd';

const mockLotRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('WmsLotService', () => {
  let service: WmsLotService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WmsLotService,
        { provide: WmsLotRepository, useValue: mockLotRepo },
      ],
    }).compile();

    service = module.get<WmsLotService>(WmsLotService);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // create
  // ────────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('nên tạo lot với tenantId inject vào organizationId', async () => {
      const dto: CreateLotDto = {
        skuId: SKU_ID,
        lotCode: 'LOT-001',
        totalQty: 100,
      };
      const expected = { _id: LOT_ID, ...dto, organizationId: TENANT_A };
      mockLotRepo.create.mockResolvedValue(expected);

      const result = await service.create(dto, TENANT_A);

      expect(mockLotRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lotCode: 'LOT-001',
          organizationId: expect.any(Types.ObjectId),
        }),
      );
      expect(result).toEqual(expected);
    });

    it('nên parse manufacturedAt và expiryAt thành Date', async () => {
      const dto: CreateLotDto = {
        skuId: SKU_ID,
        lotCode: 'LOT-002',
        manufacturedAt: '2026-01-01',
        expiryAt: '2027-01-01',
      };
      mockLotRepo.create.mockResolvedValue({ _id: LOT_ID });

      await service.create(dto, TENANT_A);

      expect(mockLotRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          manufacturedAt: expect.any(Date),
          expiryAt: expect.any(Date),
        }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findAll
  // ────────────────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('nên filter cứng theo tenantId (tenant isolation)', async () => {
      mockLotRepo.findAll.mockResolvedValue({ items: [], total: 0 });
      const query: QueryLotDto = { page: 1, limit: 10 };

      await service.findAll(query, TENANT_A);

      expect(mockLotRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: expect.any(Types.ObjectId) }),
        { skip: 0, limit: 10 },
      );
    });

    it('TENANT_B không lấy được lot của TENANT_A', async () => {
      mockLotRepo.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll({}, TENANT_B);

      const [calledFilter] = mockLotRepo.findAll.mock.calls[0];
      expect(calledFilter.organizationId.toString()).toBe(TENANT_B);
    });

    it('nên tính skip đúng theo page', async () => {
      mockLotRepo.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll({ page: 3, limit: 5 }, TENANT_A);

      expect(mockLotRepo.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        { skip: 10, limit: 5 },
      );
    });

    it('nên filter theo skuId khi truyền vào', async () => {
      mockLotRepo.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll({ skuId: SKU_ID }, TENANT_A);

      expect(mockLotRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ skuId: expect.any(Types.ObjectId) }),
        expect.any(Object),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findById
  // ────────────────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('nên trả về lot khi tìm thấy và đúng tenant', async () => {
      const lot = { _id: LOT_ID, organizationId: { toString: () => TENANT_A } };
      mockLotRepo.findById.mockResolvedValue(lot);

      const result = await service.findById(LOT_ID, TENANT_A);

      expect(result).toEqual(lot);
      expect(mockLotRepo.findById).toHaveBeenCalledWith(LOT_ID);
    });

    it('nên throw NotFoundException khi lot không tồn tại', async () => {
      mockLotRepo.findById.mockResolvedValue(null);

      await expect(service.findById(LOT_ID, TENANT_A)).rejects.toThrow(NotFoundException);
    });

    it('nên throw NotFoundException khi lot thuộc tenant khác (cross-tenant isolation)', async () => {
      const lot = { _id: LOT_ID, organizationId: { toString: () => TENANT_B } };
      mockLotRepo.findById.mockResolvedValue(lot);

      await expect(service.findById(LOT_ID, TENANT_A)).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // update
  // ────────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('nên cập nhật lot thành công', async () => {
      const lot = { _id: LOT_ID, organizationId: { toString: () => TENANT_A } };
      const updated = { ...lot, lotCode: 'LOT-NEW' };
      mockLotRepo.findById.mockResolvedValue(lot);
      mockLotRepo.update.mockResolvedValue(updated);

      const dto: UpdateLotDto = { lotCode: 'LOT-NEW' };
      const result = await service.update(LOT_ID, dto, TENANT_A);

      expect(mockLotRepo.update).toHaveBeenCalledWith(
        LOT_ID,
        expect.objectContaining({ lotCode: 'LOT-NEW' }),
      );
      expect(result).toEqual(updated);
    });

    it('nên throw NotFoundException khi update lot của tenant khác', async () => {
      const lot = { _id: LOT_ID, organizationId: { toString: () => TENANT_B } };
      mockLotRepo.findById.mockResolvedValue(lot);

      await expect(
        service.update(LOT_ID, { lotCode: 'X' }, TENANT_A),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
