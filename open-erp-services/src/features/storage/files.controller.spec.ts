import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { StorageService } from '../../core/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Readable } from 'stream';

describe('FilesController', () => {
  let controller: FilesController;
  let storageServiceMock: any;

  const mockStorageService = {
    getFileById: jest.fn(),
    updateFile: jest.fn(),
    getFileStream: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'ONLYOFFICE_BACKEND_URL') return 'http://backend-server';
      return defaultValue;
    }),
  };

  const mockJwtService = { verifyAsync: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        { provide: StorageService, useValue: mockStorageService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FilesController>(FilesController);
    storageServiceMock = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOnlyOfficeConfig', () => {
    it('should return config successfully if file exists and tenant matches', async () => {
      const mockFile = {
        id: 'file-123',
        tenantId: 'tenant-123',
        fileName: 'report.docx',
        createdAt: new Date(1718900000000),
      };

      storageServiceMock.getFileById.mockResolvedValue(mockFile);

      const req = {
        tenantId: 'tenant-123',
        user: { userId: 'user-1', email: 'test@example.com' },
      };

      const result = await controller.getOnlyOfficeConfig('file-123', 'edit', req);

      expect(result.success).toBe(true);
      expect(result.data.documentType).toBe('word');
      expect(result.data.document.fileType).toBe('docx');
      expect(result.data.document.url).toContain('/api/v1/files/file-123/download-binary');
      expect(result.data.editorConfig.mode).toBe('edit');
      expect(result.data.editorConfig.user.id).toBe('user-1');
    });

    it('should throw NotFoundException if file does not exist', async () => {
      storageServiceMock.getFileById.mockResolvedValue(null);
      await expect(
        controller.getOnlyOfficeConfig('file-invalid', 'view', { tenantId: 't' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if tenant mismatch occurs', async () => {
      const mockFile = {
        id: 'file-123',
        tenantId: 'tenant-owner',
        fileName: 'report.docx',
        createdAt: new Date(),
      };
      storageServiceMock.getFileById.mockResolvedValue(mockFile);

      await expect(
        controller.getOnlyOfficeConfig('file-123', 'view', { tenantId: 'tenant-other' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('onlyOfficeCallback', () => {
    let originalFetch: any;

    beforeAll(() => {
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it('should download and save the file if status is 2 (ready for save)', async () => {
      const mockFile = { id: 'file-123', tenantId: 'tenant-123' };
      storageServiceMock.getFileById.mockResolvedValue(mockFile);
      storageServiceMock.updateFile.mockResolvedValue(mockFile);

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });
      global.fetch = mockFetch;

      const body = { status: 2, url: 'http://onlyoffice-server/download/file.docx' };
      const result = await controller.onlyOfficeCallback('file-123', body);

      expect(result).toEqual({ error: 0 });
      expect(mockFetch).toHaveBeenCalledWith('http://onlyoffice-server/download/file.docx');
      expect(storageServiceMock.updateFile).toHaveBeenCalledWith(
        'file-123',
        'tenant-123',
        expect.any(Buffer),
      );
    });

    it('should not update file if status is not 2 or 6', async () => {
      const body = { status: 1 };
      const result = await controller.onlyOfficeCallback('file-123', body);
      expect(result).toEqual({ error: 0 });
      expect(storageServiceMock.updateFile).not.toHaveBeenCalled();
    });
  });

  describe('downloadBinary', () => {
    it('should pipe file stream to response', async () => {
      const pipeMock = jest.fn();
      const mockStream = { pipe: pipeMock };

      storageServiceMock.getFileStream.mockResolvedValue({
        stream: mockStream,
        fileName: 'report.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const resMock = {
        setHeader: jest.fn(),
      };

      await controller.downloadBinary('file-123', resMock);

      expect(resMock.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(pipeMock).toHaveBeenCalledWith(resMock);
    });
  });
});
