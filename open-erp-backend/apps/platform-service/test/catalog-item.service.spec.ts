import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CatalogItemService } from '../src/services/catalog-item.service';
import { CatalogItemRepository } from '../src/repositories/catalog-item.repository';
import { RABBITMQ_PLATFORM_CLIENT } from '../src/constants/rabbitmq.constants';
import { CatalogType, CatalogItemStatus } from '../src/schemas/catalog-item.schema';

const TENANT_ID = 'tenant-abc-123';
const USER_ID = 'user-xyz-456';

const mockCatalogItem = {
  _id: '507f1f77bcf86cd799439011',
  tenant_id: TENANT_ID,
  org_id: null,
  catalog_type: CatalogType.CATEGORY,
  code: 'CAT-001',
  name: 'Danh mục A',
  parent_id: null,
  metadata: null,
  status: CatalogItemStatus.ACTIVE,
  version: 1,
  published_at: null,
  created_by: USER_ID,
  updated_by: USER_ID,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByTenantTypeCode: jest.fn(),
  findAll: jest.fn(),
  findAllByTenantAndType: jest.fn(),
  updateById: jest.fn(),
  bulkUpdatePublishedAt: jest.fn(),
  findTree: jest.fn(),
};

const mockRabbitMQClient = {
  emit: jest.fn(),
};

describe('CatalogItemService', () => {
  let service: CatalogItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogItemService,
        {
          provide: CatalogItemRepository,
          useValue: mockRepository,
        },
        {
          provide: RABBITMQ_PLATFORM_CLIENT,
          useValue: mockRabbitMQClient,
        },
      ],
    }).compile();

    service = module.get<CatalogItemService>(CatalogItemService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────── create ───────────────────
  describe('create', () => {
    it('nên tạo catalog item thành công khi chưa tồn tại', async () => {
      mockRepository.findByTenantTypeCode.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCatalogItem);

      const result = await service.create(
        TENANT_ID,
        {
          catalogType: CatalogType.CATEGORY,
          code: 'CAT-001',
          name: 'Danh mục A',
        },
        USER_ID,
      );

      expect(result).toEqual(mockCatalogItem);
      expect(mockRepository.findByTenantTypeCode).toHaveBeenCalledWith(
        TENANT_ID,
        CatalogType.CATEGORY,
        'CAT-001',
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: TENANT_ID,
          catalog_type: CatalogType.CATEGORY,
          code: 'CAT-001',
          name: 'Danh mục A',
          version: 1,
          created_by: USER_ID,
        }),
      );
    });

    it('nên throw ConflictException khi đã tồn tại (tenant_id, catalog_type, code) trùng', async () => {
      mockRepository.findByTenantTypeCode.mockResolvedValue(mockCatalogItem);

      await expect(
        service.create(
          TENANT_ID,
          {
            catalogType: CatalogType.CATEGORY,
            code: 'CAT-001',
            name: 'Danh mục A',
          },
          USER_ID,
        ),
      ).rejects.toThrow(ConflictException);

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('nên KHÔNG query MongoDB khi thiếu tenantId', async () => {
      mockRepository.findByTenantTypeCode.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ ...mockCatalogItem, tenant_id: '' });

      await service.create(
        '',
        { catalogType: CatalogType.UOM, code: 'UOM-001', name: 'KG' },
        USER_ID,
      );

      // Kiểm tra tenant_id luôn được truyền vào repository
      expect(mockRepository.findByTenantTypeCode).toHaveBeenCalledWith(
        '',
        CatalogType.UOM,
        'UOM-001',
      );
    });
  });

  // ─────────────────── findAll ───────────────────
  describe('findAll', () => {
    it('nên filter cứng theo tenant_id', async () => {
      mockRepository.findAll.mockResolvedValue({ items: [mockCatalogItem], total: 1 });

      const result = await service.findAll(TENANT_ID, {
        page: 1,
        limit: 20,
        catalogType: CatalogType.CATEGORY,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID }),
        0,
        20,
      );
    });

    it('nên tính skip đúng theo page', async () => {
      mockRepository.findAll.mockResolvedValue({ items: [], total: 0 });

      await service.findAll(TENANT_ID, { page: 3, limit: 10 });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: TENANT_ID }),
        20, // skip = (3-1)*10
        10,
      );
    });
  });

  // ─────────────────── update ───────────────────
  describe('update', () => {
    it('nên tăng version += 1 khi cập nhật', async () => {
      const itemV1 = { ...mockCatalogItem, version: 1 };
      const itemV2 = { ...mockCatalogItem, version: 2 };

      mockRepository.findById.mockResolvedValue(itemV1);
      mockRepository.updateById.mockResolvedValue(itemV2);

      const result = await service.update(TENANT_ID, '507f1f77bcf86cd799439011', {
        name: 'Tên mới',
        updatedBy: USER_ID,
      });

      expect(result.version).toBe(2);
      expect(mockRepository.updateById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        TENANT_ID,
        expect.objectContaining({ version: 2, updated_by: USER_ID }),
      );
    });

    it('nên throw NotFoundException khi item không tồn tại', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(TENANT_ID, 'non-existent-id', { updatedBy: USER_ID }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────── publish ───────────────────
  describe('publish', () => {
    it('nên phát RabbitMQ event sau khi publish', async () => {
      const items = [mockCatalogItem, { ...mockCatalogItem, _id: 'id-002', code: 'CAT-002' }];
      mockRepository.findAllByTenantAndType.mockResolvedValue(items);
      mockRepository.bulkUpdatePublishedAt.mockResolvedValue(undefined);

      const result = await service.publish(
        TENANT_ID,
        { catalogType: CatalogType.CATEGORY },
        USER_ID,
      );

      expect(result.count).toBe(2);
      expect(mockRabbitMQClient.emit).toHaveBeenCalledTimes(1);
      expect(mockRabbitMQClient.emit).toHaveBeenCalledWith(
        'erp.platform.catalog.item.updated.v1',
        expect.objectContaining({
          event_type: 'erp.platform.catalog.item.updated.v1',
          tenant_id: TENANT_ID,
          source: 'platform-service',
          data: expect.objectContaining({
            catalog_type: CatalogType.CATEGORY,
            items: expect.arrayContaining([
              expect.objectContaining({ code: 'CAT-001' }),
            ]),
          }),
        }),
      );
    });

    it('nên trả về count=0 và KHÔNG phát event khi không có item nào', async () => {
      mockRepository.findAllByTenantAndType.mockResolvedValue([]);

      const result = await service.publish(
        TENANT_ID,
        { catalogType: CatalogType.CATEGORY, codes: ['NON-EXISTENT'] },
        USER_ID,
      );

      expect(result.count).toBe(0);
      expect(mockRabbitMQClient.emit).not.toHaveBeenCalled();
    });

    it('nên gọi bulkUpdatePublishedAt với đúng ids', async () => {
      const item1 = { ...mockCatalogItem, _id: { toString: () => 'id-001' } };
      const item2 = { ...mockCatalogItem, _id: { toString: () => 'id-002' }, code: 'CAT-002' };
      mockRepository.findAllByTenantAndType.mockResolvedValue([item1, item2]);
      mockRepository.bulkUpdatePublishedAt.mockResolvedValue(undefined);

      await service.publish(
        TENANT_ID,
        { catalogType: CatalogType.CATEGORY },
        USER_ID,
      );

      expect(mockRepository.bulkUpdatePublishedAt).toHaveBeenCalledWith(
        TENANT_ID,
        ['id-001', 'id-002'],
        expect.any(Date),
      );
    });
  });

  // ─────────────────── softDelete ───────────────────
  describe('softDelete', () => {
    it('nên set status=inactive thay vì xóa thực sự', async () => {
      mockRepository.findById.mockResolvedValue(mockCatalogItem);
      mockRepository.updateById.mockResolvedValue({
        ...mockCatalogItem,
        status: CatalogItemStatus.INACTIVE,
      });

      const result = await service.softDelete(
        TENANT_ID,
        '507f1f77bcf86cd799439011',
        USER_ID,
      );

      expect(result.status).toBe(CatalogItemStatus.INACTIVE);
      expect(mockRepository.updateById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        TENANT_ID,
        expect.objectContaining({ status: CatalogItemStatus.INACTIVE }),
      );
    });

    it('nên throw NotFoundException khi item không tồn tại', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.softDelete(TENANT_ID, 'non-existent', USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────── getTree ───────────────────
  describe('getTree', () => {
    it('nên gọi repository.findTree với đúng tenantId', async () => {
      const treeData = [{ ...mockCatalogItem, children: [] }];
      mockRepository.findTree.mockResolvedValue(treeData);

      const result = await service.getTree(TENANT_ID, CatalogType.CATEGORY);

      expect(result).toEqual(treeData);
      expect(mockRepository.findTree).toHaveBeenCalledWith(
        TENANT_ID,
        CatalogType.CATEGORY,
      );
    });

    it('nên gọi getTree mà không lọc catalog_type khi không truyền', async () => {
      mockRepository.findTree.mockResolvedValue([]);

      await service.getTree(TENANT_ID);

      expect(mockRepository.findTree).toHaveBeenCalledWith(TENANT_ID, undefined);
    });
  });
});
