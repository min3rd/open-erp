import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SysFile } from './file.entity';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('StorageService', () => {
  let service: StorageService;
  let fileRepositoryMock: any;
  let s3ClientMock: any;

  const mockConfigService = {
    get: jest.fn((key, defaultValue) => {
      if (key === 'MINIO_ENDPOINT') return 'http://localhost:9000';
      if (key === 'MINIO_ACCESS_KEY') return 'minioadmin';
      if (key === 'MINIO_SECRET_KEY') return 'minioadminpassword';
      if (key === 'MINIO_BUCKET_NAME') return 'erp-tenant-assets';
      return defaultValue;
    }),
  };

  const mockFileRepository = {
    save: jest.fn((entity) => Promise.resolve(entity)),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    s3ClientMock = {
      send: jest.fn(),
    };
    (S3Client as jest.Mock).mockImplementation(() => s3ClientMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(SysFile), useValue: mockFileRepository },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    fileRepositoryMock = module.get(getRepositoryToken(SysFile));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log success if bucket exists', async () => {
      s3ClientMock.send.mockResolvedValue({});
      const loggerLogSpy = jest.spyOn((service as any).logger, 'log');

      await service.onModuleInit();

      expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(HeadBucketCommand));
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('đã tồn tại và sẵn sàng'));
    });

    it('should create bucket if not found', async () => {
      const error = new Error('NotFound');
      error.name = 'NotFound';
      error['$metadata'] = { httpStatusCode: 404 };
      s3ClientMock.send.mockRejectedValueOnce(error).mockResolvedValueOnce({});
      const loggerLogSpy = jest.spyOn((service as any).logger, 'log');

      await service.onModuleInit();

      expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(HeadBucketCommand));
      expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(CreateBucketCommand));
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('được tạo thành công'));
    });
  });

  describe('uploadFile', () => {
    it('should successfully upload and save file metadata', async () => {
      s3ClientMock.send.mockResolvedValue({});
      const buffer = Buffer.from('test data');
      const tenantId = 'tenant-uuid';
      const moduleName = 'workflow';
      const fileName = 'invoice.docx';
      const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const result = await service.uploadFile(tenantId, moduleName, fileName, buffer, mimeType);

      expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(fileRepositoryMock.save).toHaveBeenCalled();
      expect(result.fileName).toBe(fileName);
      expect(result.tenantId).toBe(tenantId);
      expect(result.fileSize).toBe(buffer.length);
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should return download url for authorized tenant', async () => {
      const fileId = 'file-uuid';
      const tenantId = 'tenant-uuid';
      const mockFile = {
        id: fileId,
        tenantId,
        bucketName: 'erp-tenant-assets',
        objectKey: 'tenant-uuid/workflow/file-uuid_invoice.docx',
        fileName: 'invoice.docx',
      };
      fileRepositoryMock.findOne.mockResolvedValue(mockFile);
      (getSignedUrl as jest.Mock).mockResolvedValue('http://signed-url');

      const url = await service.getPresignedDownloadUrl(fileId, tenantId);

      expect(fileRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: fileId } });
      expect(url).toBe('http://signed-url');
    });

    it('should throw NotFoundException if file does not exist', async () => {
      fileRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getPresignedDownloadUrl('invalid-id', 'tenant-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if tenant mismatch', async () => {
      const fileId = 'file-uuid';
      const mockFile = {
        id: fileId,
        tenantId: 'tenant-1',
        bucketName: 'erp-tenant-assets',
        objectKey: 'tenant-1/workflow/file-uuid_invoice.docx',
      };
      fileRepositoryMock.findOne.mockResolvedValue(mockFile);

      await expect(service.getPresignedDownloadUrl(fileId, 'tenant-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file and remove metadata', async () => {
      const fileId = 'file-uuid';
      const tenantId = 'tenant-uuid';
      const mockFile = {
        id: fileId,
        tenantId,
        bucketName: 'erp-tenant-assets',
        objectKey: 'tenant-uuid/workflow/file-uuid_invoice.docx',
      };
      fileRepositoryMock.findOne.mockResolvedValue(mockFile);
      s3ClientMock.send.mockResolvedValue({});

      await service.deleteFile(fileId, tenantId);

      expect(s3ClientMock.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
      expect(fileRepositoryMock.remove).toHaveBeenCalledWith(mockFile);
    });
  });
});
