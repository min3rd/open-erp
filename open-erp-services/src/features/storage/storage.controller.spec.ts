/// <reference types="multer" />
import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from '../../core/storage/storage.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('StorageController', () => {
  let controller: StorageController;
  let storageServiceMock: any;

  const mockStorageService = {
    uploadFile: jest.fn(),
    getPresignedDownloadUrl: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        { provide: StorageService, useValue: mockStorageService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StorageController>(StorageController);
    storageServiceMock = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should successfully upload file and return response payload', async () => {
      const mockFile = {
        originalname: 'invoice.docx',
        buffer: Buffer.from('test data'),
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      } as Express.Multer.File;

      const mockSysFile = {
        id: 'file-uuid',
        tenantId: 'tenant-uuid',
        bucketName: 'erp-tenant-assets',
        objectKey: 'tenant-uuid/workflow/file-uuid_invoice.docx',
        fileName: 'invoice.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 100,
      };

      storageServiceMock.uploadFile.mockResolvedValue(mockSysFile);
      const req = { tenantId: 'tenant-uuid' };

      const response = await controller.uploadFile(mockFile, 'workflow', req);

      expect(storageServiceMock.uploadFile).toHaveBeenCalledWith(
        'tenant-uuid',
        'workflow',
        'invoice.docx',
        mockFile.buffer,
        mockFile.mimetype,
      );
      expect(response).toEqual({
        success: true,
        data: {
          fileId: 'file-uuid',
          fileName: 'invoice.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileSize: 100,
        },
      });
    });

    it('should throw BadRequestException if file is missing', async () => {
      const req = { tenantId: 'tenant-uuid' };

      await expect(controller.uploadFile(null as any, 'workflow', req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('downloadFile', () => {
    it('should return presigned URL', async () => {
      storageServiceMock.getPresignedDownloadUrl.mockResolvedValue('http://presigned-url');
      const req = { tenantId: 'tenant-uuid' };

      const response = await controller.downloadFile('file-uuid', req);

      expect(storageServiceMock.getPresignedDownloadUrl).toHaveBeenCalledWith(
        'file-uuid',
        'tenant-uuid',
      );
      expect(response).toEqual({
        success: true,
        data: {
          downloadUrl: 'http://presigned-url',
        },
      });
    });
  });
});
