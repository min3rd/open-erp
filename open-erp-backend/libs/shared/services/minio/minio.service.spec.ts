import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioService } from './minio.service';
import { Readable } from 'stream';
import * as Minio from 'minio';

// Mock MinIO client
jest.mock('minio');

describe('MinioService', () => {
  let service: MinioService;
  let mockMinioClient: jest.Mocked<Minio.Client>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock MinIO client
    mockMinioClient = {
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
      setObjectTagging: jest.fn(),
      presignedPutObject: jest.fn(),
      presignedGetObject: jest.fn(),
      getObject: jest.fn(),
      getPartialObject: jest.fn(),
      listObjectVersions: jest.fn(),
      copyObject: jest.fn(),
      setObjectMetadata: jest.fn(),
      removeObject: jest.fn(),
      removeObjects: jest.fn(),
      statObject: jest.fn(),
      listBuckets: jest.fn(),
    } as any;

    // Mock the MinIO Client constructor
    (Minio.Client as jest.MockedClass<typeof Minio.Client>).mockImplementation(
      () => mockMinioClient,
    );

    // Mock CopyConditions
    (Minio.CopyConditions as any) = jest.fn().mockImplementation(() => ({}));

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [MinioService, ConfigService],
    }).compile();

    service = module.get<MinioService>(MinioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize MinIO client with correct configuration', () => {
      expect(Minio.Client).toHaveBeenCalledWith(
        expect.objectContaining({
          endPoint: expect.any(String),
          accessKey: expect.any(String),
          secretKey: expect.any(String),
        }),
      );
    });
  });

  describe('upload', () => {
    it('should upload a file successfully', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
        versionId: 'test-version-id',
      } as any);

      const buffer = Buffer.from('test content');
      const result = await service.upload('test/file.txt', buffer, {
        contentType: 'text/plain',
        size: buffer.length,
        originalFilename: 'file.txt',
        uploadedBy: 'user123',
        metadata: { category: 'test' },
      });

      expect(mockMinioClient.bucketExists).toHaveBeenCalled();
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        buffer,
        buffer.length,
        expect.objectContaining({
          'Content-Type': 'text/plain',
          'original-filename': 'file.txt',
          'uploaded-by': 'user123',
          category: 'test',
        }),
      );
      expect(result).toMatchObject({
        key: 'test/file.txt',
        etag: 'test-etag',
        versionId: 'test-version-id',
      });
    });

    it('should create bucket if it does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);
      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
      } as any);

      const buffer = Buffer.from('test content');
      await service.upload('test/file.txt', buffer);

      expect(mockMinioClient.makeBucket).toHaveBeenCalled();
    });

    it('should sanitize keys to prevent path traversal', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
      } as any);

      const buffer = Buffer.from('test content');
      await service.upload('../../../etc/passwd', buffer);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'open-erp',
        'etc/passwd',
        expect.any(Buffer),
        undefined,
        expect.objectContaining({
          'Content-Type': 'application/octet-stream',
        }),
      );
    });

    it('should add tags if provided', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue({
        etag: 'test-etag',
      } as any);
      mockMinioClient.setObjectTagging.mockResolvedValue(undefined);

      const buffer = Buffer.from('test content');
      await service.upload('test/file.txt', buffer, {
        tags: { category: 'test', type: 'document' },
      });

      expect(mockMinioClient.setObjectTagging).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        { category: 'test', type: 'document' },
      );
    });
  });

  describe('presignUpload', () => {
    it('should generate presigned upload URL', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.presignedPutObject.mockResolvedValue(
        'https://minio.example.com/bucket/file.txt?signature=xyz',
      );

      const result = await service.presignUpload('test/file.txt', {
        expiresIn: 1800,
      });

      expect(mockMinioClient.presignedPutObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        1800,
      );
      expect(result).toMatchObject({
        url: expect.stringContaining('minio.example.com'),
        method: 'PUT',
        expiresAt: expect.any(Date),
      });
    });
  });

  describe('presignDownload', () => {
    it('should generate presigned download URL', async () => {
      mockMinioClient.presignedGetObject.mockResolvedValue(
        'https://minio.example.com/bucket/file.txt?signature=xyz',
      );

      const result = await service.presignDownload('test/file.txt', {
        expiresIn: 1800,
      });

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        1800,
        expect.any(Object),
      );
      expect(result).toMatchObject({
        url: expect.stringContaining('minio.example.com'),
        expiresAt: expect.any(Date),
      });
    });

    it('should include response headers in presigned URL', async () => {
      mockMinioClient.presignedGetObject.mockResolvedValue(
        'https://minio.example.com/bucket/file.txt?signature=xyz',
      );

      await service.presignDownload('test/file.txt', {
        responseHeaders: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename="document.pdf"',
        },
      });

      expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        expect.any(Number),
        expect.objectContaining({
          'response-content-type': 'application/pdf',
          'response-content-disposition': 'attachment; filename="document.pdf"',
        }),
      );
    });
  });

  describe('downloadStream', () => {
    it('should download file as stream', async () => {
      const mockStream = new Readable({
        read() {
          this.push('test content');
          this.push(null);
        },
      });
      mockMinioClient.getObject.mockResolvedValue(mockStream as any);

      const stream = await service.downloadStream('test/file.txt');

      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
      );
      expect(stream).toBe(mockStream);
    });

    it('should support range requests', async () => {
      const mockStream = new Readable({
        read() {
          this.push('partial content');
          this.push(null);
        },
      });
      mockMinioClient.getPartialObject.mockResolvedValue(mockStream as any);

      const stream = await service.downloadStream('test/file.txt', {
        start: 0,
        end: 100,
      });

      expect(mockMinioClient.getPartialObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        0,
        100,
      );
    });

    it('should download specific version', async () => {
      const mockStream = new Readable({
        read() {
          this.push('version content');
          this.push(null);
        },
      });
      mockMinioClient.getObject.mockResolvedValue(mockStream as any);

      await service.downloadStream('test/file.txt', {
        versionId: 'version-123',
      });

      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        expect.objectContaining({ versionId: 'version-123' }),
      );
    });
  });

  describe('listVersions', () => {
    it('should list object versions', async () => {
      const mockStream = new Readable({
        objectMode: true,
        read() {
          this.push({
            name: 'test/file.txt',
            versionId: 'v1',
            lastModified: '2024-01-01T00:00:00Z',
            size: 100,
            etag: 'etag1',
            isLatest: true,
          });
          this.push({
            name: 'test/file.txt',
            versionId: 'v2',
            lastModified: '2024-01-02T00:00:00Z',
            size: 150,
            etag: 'etag2',
            isLatest: false,
          });
          this.push(null);
        },
      });
      mockMinioClient.listObjectVersions.mockReturnValue(mockStream as any);

      const versions = await service.listVersions('test/file.txt');

      expect(versions).toHaveLength(2);
      expect(versions[0]).toMatchObject({
        versionId: 'v1',
        key: 'test/file.txt',
        isLatest: true,
      });
    });

    it('should limit number of versions returned', async () => {
      let pushCount = 0;
      const mockStream = new Readable({
        objectMode: true,
        read() {
          // Push one item at a time to simulate real streaming
          if (pushCount === 0) {
            this.push({
              name: 'test/file.txt',
              versionId: 'v1',
              lastModified: '2024-01-01T00:00:00Z',
              size: 100,
              etag: 'etag1',
              isLatest: true,
            });
            pushCount++;
          } else if (pushCount === 1) {
            this.push({
              name: 'test/file.txt',
              versionId: 'v2',
              lastModified: '2024-01-02T00:00:00Z',
              size: 150,
              etag: 'etag2',
              isLatest: false,
            });
            pushCount++;
          } else {
            this.push(null);
          }
        },
      });
      mockMinioClient.listObjectVersions.mockReturnValue(mockStream as any);

      const versions = await service.listVersions('test/file.txt', {
        maxVersions: 1,
      });

      expect(versions).toHaveLength(1);
    });
  });

  describe('copyObject', () => {
    it('should copy object to new location', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.copyObject.mockResolvedValue({
        etag: 'new-etag',
      } as any);

      const result = await service.copyObject(
        'source/file.txt',
        'dest/file.txt',
      );

      expect(mockMinioClient.copyObject).toHaveBeenCalledWith(
        expect.any(String),
        'dest/file.txt',
        expect.stringContaining('source/file.txt'),
        expect.any(Object),
      );
      expect(result).toMatchObject({
        key: 'dest/file.txt',
        etag: 'new-etag',
      });
    });
  });

  describe('moveObject', () => {
    it('should move object to new location', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.copyObject.mockResolvedValue({
        etag: 'new-etag',
      } as any);
      mockMinioClient.removeObject.mockResolvedValue(undefined);

      const result = await service.moveObject(
        'source/file.txt',
        'dest/file.txt',
      );

      expect(mockMinioClient.copyObject).toHaveBeenCalled();
      expect(mockMinioClient.removeObject).toHaveBeenCalledWith(
        expect.any(String),
        'source/file.txt',
        expect.any(Object),
      );
      expect(result).toMatchObject({
        key: 'dest/file.txt',
      });
    });
  });

  describe('deleteObject', () => {
    it('should hard delete object', async () => {
      mockMinioClient.removeObject.mockResolvedValue(undefined);

      const result = await service.deleteObject('test/file.txt');

      expect(mockMinioClient.removeObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        expect.any(Object),
      );
      expect(result).toMatchObject({
        deleted: true,
        key: 'test/file.txt',
      });
    });

    it('should soft delete object by moving to trash', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.copyObject.mockResolvedValue({
        etag: 'etag',
      } as any);
      mockMinioClient.removeObject.mockResolvedValue(undefined);

      const result = await service.deleteObject('test/file.txt', {
        softDelete: true,
      });

      expect(mockMinioClient.copyObject).toHaveBeenCalled();
      expect(result).toMatchObject({
        deleted: true,
        key: 'test/file.txt',
      });
    });
  });

  describe('deleteObjects', () => {
    it('should delete multiple objects', async () => {
      mockMinioClient.removeObjects.mockResolvedValue(undefined);

      const results = await service.deleteObjects([
        'test/file1.txt',
        'test/file2.txt',
      ]);

      expect(mockMinioClient.removeObjects).toHaveBeenCalledWith(
        expect.any(String),
        ['test/file1.txt', 'test/file2.txt'],
      );
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({ deleted: true });
    });
  });

  describe('getMetadata', () => {
    it('should get object metadata', async () => {
      mockMinioClient.statObject.mockResolvedValue({
        size: 1024,
        lastModified: new Date('2024-01-01T00:00:00Z'),
        etag: 'test-etag',
        versionId: 'version-123',
        metaData: {
          'content-type': 'application/pdf',
          'custom-field': 'value',
        },
      } as any);

      const metadata = await service.getMetadata('test/file.txt');

      expect(mockMinioClient.statObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
      );
      expect(metadata).toMatchObject({
        key: 'test/file.txt',
        size: 1024,
        etag: 'test-etag',
        contentType: 'application/pdf',
      });
    });
  });

  describe('updateMetadata', () => {
    it('should update object metadata', async () => {
      mockMinioClient.statObject.mockResolvedValue({
        size: 1024,
        lastModified: new Date('2024-01-01T00:00:00Z'),
        etag: 'test-etag',
        metaData: {
          'content-type': 'text/plain',
        },
      } as any);
      mockMinioClient.copyObject.mockResolvedValue({
        etag: 'new-etag',
      } as any);
      mockMinioClient.setObjectMetadata.mockResolvedValue(undefined);

      await service.updateMetadata('test/file.txt', {
        contentType: 'application/pdf',
        customMetadata: { category: 'documents' },
      });

      expect(mockMinioClient.setObjectMetadata).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        expect.objectContaining({
          'content-type': 'application/pdf',
          category: 'documents',
        }),
      );
    });
  });

  describe('objectExists', () => {
    it('should return true if object exists', async () => {
      mockMinioClient.statObject.mockResolvedValue({
        size: 1024,
        lastModified: new Date(),
        etag: 'test-etag',
      } as any);

      const exists = await service.objectExists('test/file.txt');

      expect(exists).toBe(true);
    });

    it('should return false if object does not exist', async () => {
      mockMinioClient.statObject.mockRejectedValue({
        code: 'NotFound',
      });

      const exists = await service.objectExists('test/nonexistent.txt');

      expect(exists).toBe(false);
    });

    it('should throw error for other failures', async () => {
      mockMinioClient.statObject.mockRejectedValue(
        new Error('Connection error'),
      );

      await expect(service.objectExists('test/file.txt')).rejects.toThrow(
        'Connection error',
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when connected', async () => {
      mockMinioClient.listBuckets.mockResolvedValue([]);
      mockMinioClient.bucketExists.mockResolvedValue(true);

      const result = await service.healthCheck();

      expect(result).toMatchObject({
        healthy: true,
        message: 'MinIO connection successful',
        timestamp: expect.any(Date),
      });
    });

    it('should return unhealthy status when bucket does not exist', async () => {
      mockMinioClient.listBuckets.mockResolvedValue([]);
      mockMinioClient.bucketExists.mockResolvedValue(false);

      const result = await service.healthCheck();

      expect(result).toMatchObject({
        healthy: false,
        message: expect.stringContaining('does not exist'),
        timestamp: expect.any(Date),
      });
    });

    it('should return unhealthy status on connection failure', async () => {
      mockMinioClient.listBuckets.mockRejectedValue(
        new Error('Connection refused'),
      );

      const result = await service.healthCheck();

      expect(result).toMatchObject({
        healthy: false,
        message: expect.stringContaining('Connection refused'),
        timestamp: expect.any(Date),
      });
    });
  });

  describe('getVersion', () => {
    it('should get specific version of object', async () => {
      const mockStream = new Readable({
        read() {
          this.push('version content');
          this.push(null);
        },
      });
      mockMinioClient.getObject.mockResolvedValue(mockStream as any);

      const stream = await service.getVersion('test/file.txt', 'version-123');

      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        expect.any(String),
        'test/file.txt',
        expect.objectContaining({ versionId: 'version-123' }),
      );
    });
  });
});
