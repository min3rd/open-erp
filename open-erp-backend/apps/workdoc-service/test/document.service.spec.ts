import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { DocumentService } from '../src/document/document.service';
import { WorkDocument } from '../src/document/schemas/document.schema';

const TENANT_A = 'tenant_A';
const TENANT_B = 'tenant_B';

const mockDoc = {
  _id: 'doc_id_1',
  tenantId: TENANT_A,
  title: 'Test Document',
  status: 'draft',
  tags: [],
  save: jest.fn().mockResolvedValue({ _id: 'doc_id_1', tenantId: TENANT_A, title: 'Test Document', status: 'draft' }),
};

const mockDocumentModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  deleteOne: jest.fn(),
  constructor: jest.fn(),
};

// Mock constructor behaviour
function MockModel(data: any) {
  Object.assign(this, data);
  this.save = jest.fn().mockResolvedValue({ ...data, _id: 'new_id' });
}

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getModelToken(WorkDocument.name),
          useValue: Object.assign(MockModel, mockDocumentModel),
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
  });

  describe('create', () => {
    it('should create a document with tenantId and createdBy', async () => {
      const dto = { title: 'New Doc', content: 'Hello world', tags: ['tag1'] };
      const result = await service.create(TENANT_A, dto, 'user_1');

      expect(result).toBeDefined();
      expect(result._id).toBe('new_id');
    });

    it('should set tenantId from parameter, not from DTO', async () => {
      const dto = { title: 'Secure Doc' };
      const result = await service.create(TENANT_B, dto, 'user_2');

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should filter documents by tenantId', async () => {
      const items = [{ _id: 'doc1', tenantId: TENANT_A, title: 'Doc 1' }];
      const chainMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(items),
      };
      mockDocumentModel.find.mockReturnValue(chainMock);
      mockDocumentModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(TENANT_A, 1, 10);

      expect(mockDocumentModel.find).toHaveBeenCalledWith({ tenantId: TENANT_A });
      expect(result.items).toEqual(items);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should isolate between tenants', async () => {
      const chainMock = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockDocumentModel.find.mockReturnValue(chainMock);
      mockDocumentModel.countDocuments.mockResolvedValue(0);

      await service.findAll(TENANT_B, 1, 20);

      const [calledFilter] = mockDocumentModel.find.mock.calls[0];
      expect(calledFilter.tenantId).toBe(TENANT_B);
    });
  });

  describe('findOne', () => {
    it('should return document when found', async () => {
      const execMock = jest.fn().mockResolvedValue(mockDoc);
      mockDocumentModel.findOne.mockReturnValue({ exec: execMock });

      const result = await service.findOne(TENANT_A, 'doc_id_1');

      expect(mockDocumentModel.findOne).toHaveBeenCalledWith({
        _id: 'doc_id_1',
        tenantId: TENANT_A,
      });
      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundException when document not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockDocumentModel.findOne.mockReturnValue({ exec: execMock });

      await expect(service.findOne(TENANT_A, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return updated document', async () => {
      const updated = { ...mockDoc, title: 'Updated Title' };
      const execMock = jest.fn().mockResolvedValue(updated);
      mockDocumentModel.findOneAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(TENANT_A, 'doc_id_1', { title: 'Updated Title' });

      expect(mockDocumentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'doc_id_1', tenantId: TENANT_A },
        { $set: { title: 'Updated Title' } },
        { new: true },
      );
      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException when document to update not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockDocumentModel.findOneAndUpdate.mockReturnValue({ exec: execMock });

      await expect(
        service.update(TENANT_A, 'nonexistent', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete document successfully', async () => {
      const execMock = jest.fn().mockResolvedValue({ deletedCount: 1 });
      mockDocumentModel.deleteOne.mockReturnValue({ exec: execMock });

      await expect(service.remove(TENANT_A, 'doc_id_1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when document to delete not found', async () => {
      const execMock = jest.fn().mockResolvedValue({ deletedCount: 0 });
      mockDocumentModel.deleteOne.mockReturnValue({ exec: execMock });

      await expect(service.remove(TENANT_A, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
