import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FileService } from './file.service';
import { MinioService } from '@shared/services/minio/minio.service';
import { FileRepository } from '../repositories/file.repository';

describe('FileService', () => {
  let service: FileService;
  let minioService: any;
  let fileRepository: any;

  beforeEach(async () => {
    minioService = {
      upload: jest.fn(),
      presignUpload: jest.fn(),
      presignDownload: jest.fn(),
      deleteObject: jest.fn(),
      copyObject: jest.fn(),
      moveObject: jest.fn(),
      healthCheck: jest.fn(),
      getDefaultBucket: jest.fn().mockReturnValue('open-erp'),
    };

    fileRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByKey: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      softDelete: jest.fn(),
      hardDelete: jest.fn(),
      bulkSoftDelete: jest.fn(),
      bulkHardDelete: jest.fn(),
      createVersion: jest.fn(),
      findVersionsByFileId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: MinioService, useValue: minioService },
        { provide: FileRepository, useValue: fileRepository },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  describe('upload', () => {
    it('should upload a file and create a DB record', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test'),
        size: 4,
      } as Express.Multer.File;

      minioService.upload.mockResolvedValue({
        key: 'files/global/123-test.pdf',
        url: 'http://localhost:9000/open-erp/files/global/123-test.pdf',
        etag: 'abc',
        bucket: 'open-erp',
      });

      fileRepository.create.mockResolvedValue({
        _id: 'file-id-1',
        key: 'files/global/123-test.pdf',
        filename: 'test.pdf',
        url: 'http://localhost:9000/open-erp/files/global/123-test.pdf',
        contentType: 'application/pdf',
        size: 4,
        version: 1,
      } as any);

      fileRepository.createVersion.mockResolvedValue({} as any);

      const result = await service.upload(mockFile, 'user-1');

      expect(result.fileId).toBe('file-id-1');
      expect(result.key).toBe('files/global/123-test.pdf');
      expect(minioService.upload).toHaveBeenCalled();
      expect(fileRepository.create).toHaveBeenCalled();
      expect(fileRepository.createVersion).toHaveBeenCalled();
    });
  });

  describe('presignUpload', () => {
    it('should generate a presigned upload URL', async () => {
      minioService.presignUpload.mockResolvedValue({
        url: 'http://localhost:9000/presigned-upload-url',
        method: 'PUT',
        expiresAt: new Date(),
      });

      const result = await service.presignUpload('test-key', 3600);

      expect(result.uploadUrl).toBe(
        'http://localhost:9000/presigned-upload-url',
      );
      expect(result.objectKey).toBe('test-key');
      expect(result.bucket).toBe('open-erp');
    });
  });

  describe('presignDownload', () => {
    it('should generate a presigned download URL', async () => {
      minioService.presignDownload.mockResolvedValue({
        url: 'http://localhost:9000/presigned-download-url',
        expiresAt: new Date(),
      });

      const result = await service.presignDownload('test-key', 3600);

      expect(result.downloadUrl).toBe(
        'http://localhost:9000/presigned-download-url',
      );
      expect(result.objectKey).toBe('test-key');
    });
  });

  describe('getFileById', () => {
    it('should return a file by ID', async () => {
      const mockFile = {
        _id: 'file-id-1',
        key: 'files/test.pdf',
        isDeleted: false,
      };
      fileRepository.findById.mockResolvedValue(mockFile as any);

      const result = await service.getFileById('file-id-1');
      expect(result._id).toBe('file-id-1');
    });

    it('should throw NotFoundException for missing file', async () => {
      fileRepository.findById.mockResolvedValue(null);

      await expect(service.getFileById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for deleted file', async () => {
      fileRepository.findById.mockResolvedValue({
        _id: 'file-id-1',
        isDeleted: true,
      } as any);

      await expect(service.getFileById('file-id-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listFiles', () => {
    it('should list files with pagination', async () => {
      fileRepository.findAll.mockResolvedValue({
        items: [{ _id: '1' }, { _id: '2' }] as any,
        total: 2,
      });

      const result = await service.listFiles({ page: 1, size: 20 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('updateFileMetadata', () => {
    it('should update file metadata', async () => {
      fileRepository.findById.mockResolvedValue({
        _id: 'file-id-1',
        isDeleted: false,
      } as any);
      fileRepository.updateById.mockResolvedValue({
        _id: 'file-id-1',
        tags: ['tag1'],
      } as any);

      const result = await service.updateFileMetadata('file-id-1', {
        tags: ['tag1'],
      });
      expect(result.tags).toEqual(['tag1']);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a file', async () => {
      fileRepository.findById.mockResolvedValue({
        _id: 'file-id-1',
        key: 'files/test.pdf',
        isDeleted: false,
      } as any);
      minioService.deleteObject.mockResolvedValue({
        deleted: true,
        key: 'files/test.pdf',
      });
      fileRepository.softDelete.mockResolvedValue({
        _id: 'file-id-1',
        isDeleted: true,
      } as any);

      const result = await service.softDelete('file-id-1');
      expect(result!.isDeleted).toBe(true);
      expect(minioService.deleteObject).toHaveBeenCalledWith('files/test.pdf', {
        softDelete: true,
      });
    });
  });

  describe('bulkDelete', () => {
    it('should bulk soft delete files', async () => {
      fileRepository.bulkSoftDelete.mockResolvedValue(3);

      const result = await service.bulkDelete(['id1', 'id2', 'id3']);
      expect(result.deletedCount).toBe(3);
    });

    it('should bulk hard delete files', async () => {
      fileRepository.findById.mockResolvedValue({
        key: 'files/test.pdf',
      } as any);
      minioService.deleteObject.mockResolvedValue({
        deleted: true,
        key: 'files/test.pdf',
      });
      fileRepository.bulkHardDelete.mockResolvedValue(2);

      const result = await service.bulkDelete(['id1', 'id2'], true);
      expect(result.deletedCount).toBe(2);
    });
  });

  describe('copyFile', () => {
    it('should copy a file', async () => {
      fileRepository.findById.mockResolvedValue({
        _id: 'file-id-1',
        key: 'files/test.pdf',
        filename: 'test.pdf',
        contentType: 'application/pdf',
        size: 100,
        isDeleted: false,
      } as any);

      minioService.copyObject.mockResolvedValue({
        key: 'files/copy-test.pdf',
        url: 'http://localhost:9000/open-erp/files/copy-test.pdf',
        etag: 'abc',
        bucket: 'open-erp',
      });

      fileRepository.create.mockResolvedValue({
        _id: 'file-id-2',
        key: 'files/copy-test.pdf',
      } as any);

      const result = await service.copyFile('file-id-1', {
        destinationKey: 'files/copy-test.pdf',
      });
      expect(result._id).toBe('file-id-2');
      expect(minioService.copyObject).toHaveBeenCalled();
    });
  });

  describe('getMinioHealth', () => {
    it('should return MinIO health status', async () => {
      minioService.healthCheck.mockResolvedValue({
        healthy: true,
        message: 'MinIO connection successful',
        timestamp: new Date(),
      });

      const result = await service.getMinioHealth();
      expect(result.healthy).toBe(true);
    });
  });
});
