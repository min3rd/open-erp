import { Test, TestingModule } from '@nestjs/testing';
import { DocumentTemplateService } from './document-template.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DocumentTemplate } from './entities/document-template.entity';
import { WorkflowInstance } from '../workflow/entities/workflow-instance.entity';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';

describe('DocumentTemplateService', () => {
  let service: DocumentTemplateService;
  let templateRepoMock: any;
  let workflowRepoMock: any;
  let storageServiceMock: any;
  let configServiceMock: any;

  const mockTemplateRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn().mockImplementation((x) => Promise.resolve({ id: 'temp-123', ...x })),
    remove: jest.fn(),
  };

  const mockWorkflowRepository = {
    findOne: jest.fn(),
  };

  const mockStorageService = {
    getFileById: jest.fn(),
    getFileStream: jest.fn(),
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'ONLYOFFICE_CONVERSION_URL') return 'http://onlyoffice-server/convert';
      if (key === 'ONLYOFFICE_BACKEND_URL') return 'http://backend-server';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentTemplateService,
        {
          provide: getRepositoryToken(DocumentTemplate),
          useValue: mockTemplateRepository,
        },
        {
          provide: getRepositoryToken(WorkflowInstance),
          useValue: mockWorkflowRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DocumentTemplateService>(DocumentTemplateService);
    templateRepoMock = module.get(getRepositoryToken(DocumentTemplate));
    workflowRepoMock = module.get(getRepositoryToken(WorkflowInstance));
    storageServiceMock = module.get(StorageService);
    configServiceMock = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTemplate', () => {
    it('should successfully create a template', async () => {
      const tenantId = 'tenant-123';
      const fileId = 'file-123';
      const mapping = [{ placeholder: 'name', source: 'context.name' }];
      const mockFile = { id: fileId, fileName: 'test.docx' };

      storageServiceMock.getFileById.mockResolvedValue(mockFile);
      templateRepoMock.save.mockResolvedValue({
        id: 'temp-123',
        tenantId,
        name: 'Contract Template',
        fileId,
        mapping,
      });

      const result = await service.createTemplate(tenantId, 'Contract Template', fileId, mapping);
      expect(result).toBeDefined();
      expect(result.id).toBe('temp-123');
      expect(result.name).toBe('Contract Template');
      expect(storageServiceMock.getFileById).toHaveBeenCalledWith(fileId);
    });

    it('should throw NotFoundException if file does not exist', async () => {
      storageServiceMock.getFileById.mockResolvedValue(null);

      await expect(
        service.createTemplate('tenant-123', 'Contract Template', 'file-invalid', []),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTemplateById', () => {
    it('should return the template if found and tenant matches', async () => {
      const mockTemplate = { id: 'temp-123', tenantId: 'tenant-123', name: 'T1' };
      templateRepoMock.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateById('temp-123', 'tenant-123');
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException if template is not found', async () => {
      templateRepoMock.findOne.mockResolvedValue(null);
      await expect(service.getTemplateById('temp-invalid', 't')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if tenant mismatch occurs', async () => {
      const mockTemplate = { id: 'temp-123', tenantId: 'tenant-owner', name: 'T1' };
      templateRepoMock.findOne.mockResolvedValue(mockTemplate);

      await expect(service.getTemplateById('temp-123', 'tenant-other')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllTemplates', () => {
    it('should return list of templates for specific tenant', async () => {
      const list = [{ id: '1' }, { id: '2' }];
      templateRepoMock.find.mockResolvedValue(list);

      const result = await service.findAllTemplates('tenant-1');
      expect(result).toEqual(list);
    });
  });

  describe('deleteTemplate', () => {
    it('should remove template if it exists and tenant matches', async () => {
      const mockTemplate = { id: 'temp-123', tenantId: 'tenant-123' };
      templateRepoMock.findOne.mockResolvedValue(mockTemplate);
      templateRepoMock.remove.mockResolvedValue(mockTemplate);

      await service.deleteTemplate('temp-123', 'tenant-123');
      expect(templateRepoMock.remove).toHaveBeenCalledWith(mockTemplate);
    });
  });

  describe('generateDocument', () => {
    let originalFetch: any;

    beforeAll(() => {
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it('should generate document without conversion if output format matches template', async () => {
      const tenantId = 'tenant-123';
      const mockTemplateFile = { id: 'file-doc', fileName: 'contract.docx', mimeType: 'docx-mime' };
      const mockTemplate = {
        id: 'temp-123',
        tenantId,
        name: 'Contract.docx',
        file: mockTemplateFile,
        mapping: [
          { placeholder: 'name', source: 'context.name', transform: 'uppercase' },
          { placeholder: 'amount', source: 'context.amount', transform: 'currency_text' },
        ],
      };

      const mockInstance = {
        id: 'inst-123',
        contextData: { name: 'john doe', amount: 1500000 },
      };

      const stream = Readable.from([Buffer.from('Hello {{name}}, total is {{amount}}')]);

      templateRepoMock.findOne.mockResolvedValue(mockTemplate);
      workflowRepoMock.findOne.mockResolvedValue(mockInstance);
      storageServiceMock.getFileStream.mockResolvedValue({ stream });

      storageServiceMock.uploadFile.mockResolvedValue({ id: 'temp-out-file' });
      storageServiceMock.getPresignedDownloadUrl.mockResolvedValue('http://presigned-url/out');

      const result = await service.generateDocument('temp-123', 'inst-123', 'DOCX', tenantId);

      expect(result.fileName).toBe('Contract_generated.docx');
      expect(result.fileUrl).toBe('http://presigned-url/out');

      // Verify template substitution logic (on the non-zip fallback)
      expect(storageServiceMock.uploadFile).toHaveBeenCalledWith(
        tenantId,
        'document-generation',
        'Contract_generated.docx',
        Buffer.from('Hello JOHN DOE, total is 1.500.000'),
        'docx-mime',
      );
    });

    it('should generate and convert to PDF if requested format is PDF', async () => {
      const tenantId = 'tenant-123';
      const mockTemplateFile = { id: 'file-doc', fileName: 'contract.docx', mimeType: 'docx-mime' };
      const mockTemplate = {
        id: 'temp-123',
        tenantId,
        name: 'Contract.docx',
        file: mockTemplateFile,
        mapping: [{ placeholder: 'name', source: 'context.name' }],
      };

      const mockInstance = {
        id: 'inst-123',
        contextData: { name: 'Jane' },
      };

      const stream = Readable.from([Buffer.from('Hello {{name}}')]);

      templateRepoMock.findOne.mockResolvedValue(mockTemplate);
      workflowRepoMock.findOne.mockResolvedValue(mockInstance);
      storageServiceMock.getFileStream.mockResolvedValue({ stream });

      const mockTempFile = { id: 'temp-out-file', fileName: 'Contract_generated.docx' };
      storageServiceMock.uploadFile.mockResolvedValueOnce(mockTempFile); // temp upload
      storageServiceMock.deleteFile.mockResolvedValue(undefined);

      const mockFinalFile = { id: 'pdf-out-file', fileName: 'Contract_generated.pdf' };
      storageServiceMock.uploadFile.mockResolvedValueOnce(mockFinalFile); // final PDF upload
      storageServiceMock.getPresignedDownloadUrl.mockResolvedValue('http://presigned-url/pdf');

      // Mock onlyoffice conversion fetch call
      const mockFetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url === 'http://onlyoffice-server/convert') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ fileUrl: 'http://onlyoffice-download-url/converted.pdf' }),
          });
        }
        if (url === 'http://onlyoffice-download-url/converted.pdf') {
          return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });
      global.fetch = mockFetch;

      const result = await service.generateDocument('temp-123', 'inst-123', 'PDF', tenantId);

      expect(result.fileName).toBe('Contract_generated.pdf');
      expect(result.fileUrl).toBe('http://presigned-url/pdf');
      expect(storageServiceMock.deleteFile).toHaveBeenCalledWith('temp-out-file', tenantId);
    });
  });
});
