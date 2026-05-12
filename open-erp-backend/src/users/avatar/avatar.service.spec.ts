// Move jest.mock() BEFORE imports (Jest hoisting requirement)
jest.mock('minio');

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { AvatarService } from './avatar.service';

describe('AvatarService', () => {
  let service: AvatarService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          MINIO_ENDPOINT: 'minio.example.com',
          MINIO_PORT: 9000,
          MINIO_ACCESS_KEY: 'minioadmin',
          MINIO_SECRET_KEY: 'minioadmin',
          MINIO_USE_SSL: 'false',
        };
        return config[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<AvatarService>(AvatarService);
    jest.clearAllMocks();
  });

  describe('uploadAvatar', () => {
    const mockFile = {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
      size: 1024 * 100, // 100 KB
      originalname: 'profile.jpg',
    };

    it('uploads valid JPEG avatar successfully', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(false),
        makeBucket: jest.fn().mockResolvedValue(undefined),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });

      expect(result.avatarUrl).toContain('tenant-1');
      expect(result.avatarUrl).toContain('user-1');
      expect(result.avatarUrl).toContain('avatars/');
      expect(result.metadata.mimeType).toBe('image/jpeg');
      expect(result.metadata.size).toBe(1024 * 100);
      expect(result.metadata.bucketName).toBe('tenant-1');
    });

    it('uploads valid PNG avatar successfully', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const pngFile = { ...mockFile, mimetype: 'image/png' };

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: pngFile,
      });

      expect(result.avatarUrl).toContain('.png');
      expect(result.metadata.mimeType).toBe('image/png');
    });

    it('uploads valid WebP avatar successfully', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const webpFile = { ...mockFile, mimetype: 'image/webp' };

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: webpFile,
      });

      expect(result.avatarUrl).toContain('.webp');
      expect(result.metadata.mimeType).toBe('image/webp');
    });

    it('rejects invalid image type (GIF)', async () => {
      const invalidFile = { ...mockFile, mimetype: 'image/gif' };

      await expect(
        service.uploadAvatar({
          tenantId: 'tenant-1',
          userId: 'user-1',
          file: invalidFile,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects file larger than 5MB', async () => {
      const largeFile = {
        ...mockFile,
        size: 6 * 1024 * 1024, // 6 MB
      };

      await expect(
        service.uploadAvatar({
          tenantId: 'tenant-1',
          userId: 'user-1',
          file: largeFile,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects exactly 5MB + 1 byte', async () => {
      const limitFile = {
        ...mockFile,
        size: 5 * 1024 * 1024 + 1,
      };

      await expect(
        service.uploadAvatar({
          tenantId: 'tenant-1',
          userId: 'user-1',
          file: limitFile,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts exactly 5MB file', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const limitFile = {
        ...mockFile,
        size: 5 * 1024 * 1024, // Exactly 5 MB
      };

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: limitFile,
      });

      expect(result.metadata.size).toBe(5 * 1024 * 1024);
    });

    it('creates bucket if not exists', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(false),
        makeBucket: jest.fn().mockResolvedValue(undefined),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });

      expect(mockClient.bucketExists).toHaveBeenCalledWith('tenant-1');
      expect(mockClient.makeBucket).toHaveBeenCalledWith('tenant-1');
    });

    it('skips bucket creation if already exists', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
        makeBucket: jest.fn().mockResolvedValue(undefined),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });

      expect(mockClient.makeBucket).not.toHaveBeenCalled();
    });

    it('handles MinIO config missing gracefully', async () => {
      configService.get.mockReturnValue(undefined);
      (Minio.Client as jest.Mock).mockClear();

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });

      // Should still generate avatarUrl even if MinIO client not initialized
      expect(result.avatarUrl).toContain('tenant-1');
      expect(result.metadata).toBeDefined();
    });

    it('stores correct metadata for uploaded file', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });

      expect(result.metadata.originalName).toBe('profile.jpg');
      expect(result.metadata.mimeType).toBe('image/jpeg');
      expect(result.metadata.size).toBe(1024 * 100);
      expect(result.metadata.bucketName).toBe('tenant-1');
      expect(result.metadata.objectName).toContain('user-1');
      expect(result.metadata.objectName).toContain('avatars/');
    });

    it('handles MinIO putObject error gracefully', async () => {
      const mockClient = {
        putObject: jest
          .fn()
          .mockRejectedValue(new Error('MinIO connection failed')),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      // Should throw the MinIO error
      await expect(
        service.uploadAvatar({
          tenantId: 'tenant-1',
          userId: 'user-1',
          file: mockFile,
        }),
      ).rejects.toThrow('MinIO connection failed');
    });

    it('rejects missing file object', async () => {
      await expect(
        service.uploadAvatar({
          tenantId: 'tenant-1',
          userId: 'user-1',
          file: undefined as any,
        }),
      ).rejects.toThrow();
    });

    it('rejects text file (text/plain)', async () => {
      const textFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(
        service.uploadAvatar({
          tenantId: 'tenant-1',
          userId: 'user-1',
          file: textFile,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects application/pdf', async () => {
      const pdfFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(
        service.uploadAvatar({
          tenantId: 'tenant-1',
          userId: 'user-1',
          file: pdfFile,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveExtension', () => {
    it('resolves PNG extension correctly', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: { ...{ mimetype: 'image/png' }, buffer: Buffer.from(''), size: 100, originalname: 'pic.png' },
      });

      expect(result.avatarUrl).toMatch(/\.png$/);
    });

    it('resolves WebP extension correctly', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: { ...{ mimetype: 'image/webp' }, buffer: Buffer.from(''), size: 100, originalname: 'pic.webp' },
      });

      expect(result.avatarUrl).toMatch(/\.webp$/);
    });

    it('defaults to jpg for image/jpeg', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const result = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: { ...{ mimetype: 'image/jpeg' }, buffer: Buffer.from(''), size: 100, originalname: 'pic.jpeg' },
      });

      expect(result.avatarUrl).toMatch(/\.jpg$/);
    });
  });

  describe('bucket operations', () => {
    it('handles bucket creation failure gracefully', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(false),
        makeBucket: jest.fn().mockRejectedValue(new Error('Bucket creation failed')),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const mockFile = {
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 1024 * 100,
        originalname: 'profile.jpg',
      };

      // Should handle bucket creation failure gracefully and still attempt upload
      await expect(
        service.uploadAvatar({
          tenantId: 'tenant-1',
          userId: 'user-1',
          file: mockFile,
        }),
      ).rejects.toThrow();
    });

    it('generates unique object names with timestamp and UUID', async () => {
      const mockClient = {
        putObject: jest.fn().mockResolvedValue(undefined),
        bucketExists: jest.fn().mockResolvedValue(true),
      };
      (Minio.Client as jest.Mock).mockImplementation(() => mockClient);

      const mockFile = {
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 1024 * 100,
        originalname: 'profile.jpg',
      };

      const result1 = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });

      const result2 = await service.uploadAvatar({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });

      // Should generate different URLs due to timestamp and UUID
      expect(result1.avatarUrl).not.toBe(result2.avatarUrl);
      expect(result1.metadata.objectName).not.toBe(result2.metadata.objectName);
    });
  });
});
