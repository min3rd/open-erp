import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OnlyOfficeService } from './onlyoffice.service';
import { MinioService } from '@shared/services/minio/minio.service';
import { FileRepository } from '../repositories/file.repository';

describe('OnlyOfficeService', () => {
  let service: OnlyOfficeService;
  let minioService: jest.Mocked<Partial<MinioService>>;
  let fileRepository: jest.Mocked<Partial<FileRepository>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    minioService = {
      presignDownload: jest.fn(),
    };

    fileRepository = {
      findById: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          ONLYOFFICE_URL: 'http://localhost:8080',
          ONLYOFFICE_JWT_SECRET: '',
          ONLYOFFICE_CALLBACK_SECRET: '',
          FILE_SERVICE_BASE_URL: 'http://localhost:3008',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlyOfficeService,
        { provide: MinioService, useValue: minioService },
        { provide: FileRepository, useValue: fileRepository },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<OnlyOfficeService>(OnlyOfficeService);
  });

  describe('createSession', () => {
    it('should create an editing session for a docx file', async () => {
      fileRepository.findById.mockResolvedValue({
        _id: 'file-id-1',
        key: 'files/test.docx',
        filename: 'test.docx',
        version: 1,
        isDeleted: false,
      } as any);

      minioService.presignDownload.mockResolvedValue({
        url: 'http://localhost:9000/presigned-url',
        expiresAt: new Date(),
      });

      const result = await service.createSession('file-id-1', 'edit', 'user-1');

      expect(result.editorUrl).toContain('api/documents/api.js');
      expect(result.config).toBeDefined();
      expect(result.config.document.title).toBe('test.docx');
      expect(result.config.documentType).toBe('word');
      expect(result.config.editorConfig.mode).toBe('edit');
      expect(result.documentKey).toBeDefined();
    });

    it('should create a view-only session', async () => {
      fileRepository.findById.mockResolvedValue({
        _id: 'file-id-1',
        key: 'files/test.xlsx',
        filename: 'test.xlsx',
        version: 1,
        isDeleted: false,
      } as any);

      minioService.presignDownload.mockResolvedValue({
        url: 'http://localhost:9000/presigned-url',
        expiresAt: new Date(),
      });

      const result = await service.createSession('file-id-1', 'view');

      expect(result.config.editorConfig.mode).toBe('view');
      expect(result.config.documentType).toBe('cell');
      expect(result.config.document.permissions.edit).toBe(false);
    });

    it('should throw NotFoundException for missing file', async () => {
      fileRepository.findById.mockResolvedValue(null);

      await expect(
        service.createSession('nonexistent', 'edit'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for unsupported file type', async () => {
      fileRepository.findById.mockResolvedValue({
        _id: 'file-id-1',
        key: 'files/test.txt',
        filename: 'test.txt',
        version: 1,
        isDeleted: false,
      } as any);

      await expect(
        service.createSession('file-id-1', 'edit'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a session using minioKey and filename', async () => {
      minioService.presignDownload.mockResolvedValue({
        url: 'http://localhost:9000/presigned-url',
        expiresAt: new Date(),
      });

      const result = await service.createSession(
        undefined,
        'view',
        'user-1',
        undefined,
        'products/org-123/prod-456/media/test.pptx',
        'test.pptx',
        'my-bucket',
      );

      expect(result.editorUrl).toContain('api/documents/api.js');
      expect(result.config.document.title).toBe('test.pptx');
      expect(result.config.documentType).toBe('slide');
      expect(result.config.editorConfig.mode).toBe('view');
      expect(result.documentKey).toBeDefined();
      // Should not call fileRepository.findById
      expect(fileRepository.findById).not.toHaveBeenCalled();
      // Should pass bucket to presignDownload
      expect(minioService.presignDownload).toHaveBeenCalledWith(
        'products/org-123/prod-456/media/test.pptx',
        { bucket: 'my-bucket', expiresIn: 7200 },
      );
    });

    it('should throw BadRequestException when neither fileId nor minioKey provided', async () => {
      await expect(
        service.createSession(undefined, 'edit'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleCallback', () => {
    it('should handle status 2 (ready to save) successfully', async () => {
      const result = await service.handleCallback({
        status: 2,
        url: 'http://onlyoffice/download/doc',
        key: 'doc-key',
        users: ['user-1'],
      });

      expect(result.error).toBe(0);
    });

    it('should handle status 4 (closed without changes)', async () => {
      const result = await service.handleCallback({
        status: 4,
        key: 'doc-key',
      });

      expect(result.error).toBe(0);
    });

    it('should handle status 6 (force save)', async () => {
      const result = await service.handleCallback({
        status: 6,
        url: 'http://onlyoffice/download/doc',
        key: 'doc-key',
      });

      expect(result.error).toBe(0);
    });
  });
});
