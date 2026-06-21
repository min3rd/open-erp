import { Test, TestingModule } from '@nestjs/testing';
import { DocumentTemplateController } from './document-template.controller';
import { DocumentTemplateService } from '../../core/document-template/document-template.service';
import { StorageService } from '../../core/storage/storage.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';

describe('DocumentTemplateController', () => {
  let controller: DocumentTemplateController;
  let templateServiceMock: any;
  let storageServiceMock: any;

  const mockTemplateService = {
    createTemplate: jest.fn(),
    findAllTemplates: jest.fn(),
    generateDocument: jest.fn(),
    deleteTemplate: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
  };

  const mockJwtService = { verifyAsync: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentTemplateController],
      providers: [
        { provide: DocumentTemplateService, useValue: mockTemplateService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DocumentTemplateController>(DocumentTemplateController);
    templateServiceMock = module.get<DocumentTemplateService>(DocumentTemplateService);
    storageServiceMock = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should upload template and save record successfully', async () => {
      const mockFile = {
        originalname: 'temp.docx',
        buffer: Buffer.from('test'),
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      } as Express.Multer.File;

      const mockSavedFile = { id: 'file-123' };
      storageServiceMock.uploadFile.mockResolvedValue(mockSavedFile);

      const mockTemplate = { id: 'temp-123', name: 'Contract' };
      templateServiceMock.createTemplate.mockResolvedValue(mockTemplate);

      const req = { tenantId: 'tenant-123' };
      const result = await controller.create(mockFile, 'Contract', '[{"placeholder":"name"}]', req);

      expect(result.success).toBe(true);
      expect(result.data.templateId).toBe('temp-123');
      expect(result.data.name).toBe('Contract');
      expect(storageServiceMock.uploadFile).toHaveBeenCalledWith(
        'tenant-123',
        'document-templates',
        'temp.docx',
        mockFile.buffer,
        mockFile.mimetype,
      );
      expect(templateServiceMock.createTemplate).toHaveBeenCalledWith(
        'tenant-123',
        'Contract',
        'file-123',
        [{ placeholder: 'name' }],
      );
    });

    it('should throw BadRequestException if file is missing', async () => {
      await expect(
        controller.create(undefined as any, 'Contract', '', { tenantId: 't' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if name is missing', async () => {
      const file = { originalname: 't.docx' } as any;
      await expect(controller.create(file, '', '', { tenantId: 't' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if mapping JSON is invalid', async () => {
      const file = { originalname: 't.docx' } as any;
      await expect(controller.create(file, 'Name', 'invalid-json', { tenantId: 't' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return list of templates', async () => {
      const list = [
        {
          id: 'temp-1',
          name: 'T1',
          fileId: 'f1',
          mapping: [],
          createdAt: new Date(),
        },
      ];
      templateServiceMock.findAllTemplates.mockResolvedValue(list);

      const result = await controller.findAll({ tenantId: 'tenant-1' });
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0].templateId).toBe('temp-1');
    });
  });

  describe('generate', () => {
    it('should trigger template generation', async () => {
      templateServiceMock.generateDocument.mockResolvedValue({
        fileUrl: 'http://url/res.docx',
        fileName: 'res.docx',
      });

      const result = await controller.generate('temp-123', 'inst-456', 'DOCX', {
        tenantId: 'tenant-123',
      });
      expect(result.success).toBe(true);
      expect(result.data.fileName).toBe('res.docx');
    });

    it('should throw BadRequestException if instanceId is missing', async () => {
      await expect(controller.generate('temp-123', '', 'PDF', { tenantId: 't' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('should delete the template successfully', async () => {
      templateServiceMock.deleteTemplate.mockResolvedValue(undefined);

      const result = await controller.delete('temp-123', { tenantId: 'tenant-123' });
      expect(result.success).toBe(true);
      expect(result.messageKey).toBe('template.deleted');
      expect(templateServiceMock.deleteTemplate).toHaveBeenCalledWith('temp-123', 'tenant-123');
    });
  });
});
