import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WmsSerialService } from '../src/services/serial.service';
import { WmsSerialRepository } from '../src/repositories/serial.repository';
import { CreateSerialDto, UpdateSerialDto, QuerySerialDto } from '../src/dto/serial.dto';
import { SerialStatus } from '@shared/schemas';

const TENANT_A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const SKU_ID = 'cccccccccccccccccccccccc';
const SERIAL_ID = 'dddddddddddddddddddddddd';
const BIN_ID = 'eeeeeeeeeeeeeeeeeeeeeeee';

const mockSerialRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('WmsSerialService', () => {
  let service: WmsSerialService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WmsSerialService,
        { provide: WmsSerialRepository, useValue: mockSerialRepo },
      ],
    }).compile();

    service = module.get<WmsSerialService>(WmsSerialService);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // create
  // ────────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('nên tạo serial với status=AVAILABLE và tenantId inject vào organizationId', async () => {
      const dto: CreateSerialDto = { skuId: SKU_ID, serial: 'SN-001' };
      const expected = {
        _id: SERIAL_ID,
        serial: 'SN-001',
        status: SerialStatus.AVAILABLE,
        organizationId: TENANT_A,
      };
      mockSerialRepo.create.mockResolvedValue(expected);

      const result = await service.create(dto, TENANT_A);

      expect(mockSerialRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          serial: 'SN-001',
          status: SerialStatus.AVAILABLE,
          organizationId: expect.any(Types.ObjectId),
        }),
      );
      expect(result).toEqual(expected);
    });

    it('nên map binId và lotId thành ObjectId nếu được truyền', async () => {
      const LOT_ID = 'ffffffffffffffffffffffff';
      const dto: CreateSerialDto = { skuId: SKU_ID, serial: 'SN-002', binId: BIN_ID, lotId: LOT_ID };
      mockSerialRepo.create.mockResolvedValue({ _id: SERIAL_ID });

      await service.create(dto, TENANT_A);

      expect(mockSerialRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          binId: expect.any(Types.ObjectId),
          lotId: expect.any(Types.ObjectId),
        }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findAll
  // ────────────────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('nên filter cứng theo tenantId (tenant isolation)', async () => {
      mockSerialRepo.findAll.mockResolvedValue({ items: [], total: 0 });
      const query: QuerySerialDto = { page: 1, limit: 20 };

      await service.findAll(query, TENANT_A);

      expect(mockSerialRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: expect.any(Types.ObjectId) }),
        { skip: 0, limit: 20 },
      );
    });

    it('TENANT_B không lấy được serial của TENANT_A', async () => {
      mockSerialRepo.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll({}, TENANT_B);

      const [calledFilter] = mockSerialRepo.findAll.mock.calls[0];
      expect(calledFilter.organizationId.toString()).toBe(TENANT_B);
    });

    it('nên filter theo status khi truyền vào', async () => {
      mockSerialRepo.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll({ status: SerialStatus.RESERVED }, TENANT_A);

      expect(mockSerialRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: SerialStatus.RESERVED }),
        expect.any(Object),
      );
    });

    it('nên tính skip đúng theo page', async () => {
      mockSerialRepo.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll({ page: 2, limit: 10 }, TENANT_A);

      expect(mockSerialRepo.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        { skip: 10, limit: 10 },
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findById
  // ────────────────────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('nên trả về serial khi tìm thấy và đúng tenant', async () => {
      const serial = { _id: SERIAL_ID, organizationId: { toString: () => TENANT_A } };
      mockSerialRepo.findById.mockResolvedValue(serial);

      const result = await service.findById(SERIAL_ID, TENANT_A);

      expect(result).toEqual(serial);
      expect(mockSerialRepo.findById).toHaveBeenCalledWith(SERIAL_ID);
    });

    it('nên throw NotFoundException khi serial không tồn tại', async () => {
      mockSerialRepo.findById.mockResolvedValue(null);

      await expect(service.findById(SERIAL_ID, TENANT_A)).rejects.toThrow(NotFoundException);
    });

    it('nên throw NotFoundException khi serial thuộc tenant khác (cross-tenant isolation)', async () => {
      const serial = { _id: SERIAL_ID, organizationId: { toString: () => TENANT_B } };
      mockSerialRepo.findById.mockResolvedValue(serial);

      await expect(service.findById(SERIAL_ID, TENANT_A)).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // update (update status)
  // ────────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('nên cập nhật status serial thành công', async () => {
      const serial = { _id: SERIAL_ID, organizationId: { toString: () => TENANT_A } };
      const updated = { ...serial, status: SerialStatus.RESERVED };
      mockSerialRepo.findById.mockResolvedValue(serial);
      mockSerialRepo.update.mockResolvedValue(updated);

      const dto: UpdateSerialDto = { status: SerialStatus.RESERVED };
      const result = await service.update(SERIAL_ID, dto, TENANT_A);

      expect(mockSerialRepo.update).toHaveBeenCalledWith(
        SERIAL_ID,
        expect.objectContaining({ status: SerialStatus.RESERVED }),
      );
      expect(result).toEqual(updated);
    });

    it('nên cập nhật binId thành ObjectId', async () => {
      const serial = { _id: SERIAL_ID, organizationId: { toString: () => TENANT_A } };
      mockSerialRepo.findById.mockResolvedValue(serial);
      mockSerialRepo.update.mockResolvedValue({ ...serial, binId: BIN_ID });

      const dto: UpdateSerialDto = { binId: BIN_ID };
      await service.update(SERIAL_ID, dto, TENANT_A);

      expect(mockSerialRepo.update).toHaveBeenCalledWith(
        SERIAL_ID,
        expect.objectContaining({ binId: expect.any(Types.ObjectId) }),
      );
    });

    it('nên throw NotFoundException khi update serial của tenant khác', async () => {
      const serial = { _id: SERIAL_ID, organizationId: { toString: () => TENANT_B } };
      mockSerialRepo.findById.mockResolvedValue(serial);

      await expect(
        service.update(SERIAL_ID, { status: SerialStatus.CONSUMED }, TENANT_A),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
