import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { MinioStorageAdapter } from './minio-storage.adapter';

jest.mock('minio');

describe('MinioStorageAdapter', () => {
  let adapter: MinioStorageAdapter;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioStorageAdapter,
        {
          provide: ConfigService,
          useValue: {
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
          },
        },
      ],
    }).compile();

    adapter = module.get<MinioStorageAdapter>(MinioStorageAdapter);
    configService = module.get<ConfigService>(ConfigService);

    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize MinIO client when config is valid', () => {
      expect((adapter as any).client).toBeDefined();
    });

    it('should set client to null when endpoint is missing', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'MINIO_ENDPOINT') return null;
        return {
          MINIO_PORT: 9000,
          MINIO_ACCESS_KEY: 'key',
          MINIO_SECRET_KEY: 'secret',
        }[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MinioStorageAdapter,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const newAdapter = module.get<MinioStorageAdapter>(MinioStorageAdapter);
      expect((newAdapter as any).client).toBeNull();
    });

    it('should set client to null when access key is missing', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'MINIO_ACCESS_KEY') return null;
        return {
          MINIO_ENDPOINT: 'minio.example.com',
          MINIO_PORT: 9000,
          MINIO_SECRET_KEY: 'secret',
        }[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MinioStorageAdapter,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const newAdapter = module.get<MinioStorageAdapter>(MinioStorageAdapter);
      expect((newAdapter as any).client).toBeNull();
    });

    it('should use default MinIO port if not configured', async () => {
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        const config: Record<string, any> = {
          MINIO_ENDPOINT: 'minio.example.com',
          MINIO_PORT: undefined,
          MINIO_ACCESS_KEY: 'key',
          MINIO_SECRET_KEY: 'secret',
        };
        return config[key];
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MinioStorageAdapter,
          { provide: ConfigService, useValue: configService },
        ],
      }).compile();

      const newAdapter = module.get<MinioStorageAdapter>(MinioStorageAdapter);
      expect((newAdapter as any).client).toBeDefined();
    });
  });

  describe('createBucket', () => {
    it('should return fallback result when client is null', async () => {
      (adapter as any).client = null;

      const result = await adapter.createBucket('test-bucket');

      expect(result).toEqual({
        bucketName: 'test-bucket',
        created: false,
        provider: 'null',
      });
    });

    it('should create bucket when it does not exist', async () => {
      const mockClient = {
        bucketExists: jest.fn().mockResolvedValue(false),
        makeBucket: jest.fn().mockResolvedValue(undefined),
      };

      (adapter as any).client = mockClient;

      const result = await adapter.createBucket('new-bucket');

      expect(mockClient.bucketExists).toHaveBeenCalledWith('new-bucket');
      expect(mockClient.makeBucket).toHaveBeenCalledWith(
        'new-bucket',
        'us-east-1',
      );
      expect(result).toEqual({
        bucketName: 'new-bucket',
        created: true,
        provider: 'minio',
      });
    });

    it('should not create bucket when it already exists', async () => {
      const mockClient = {
        bucketExists: jest.fn().mockResolvedValue(true),
        makeBucket: jest.fn(),
      };

      (adapter as any).client = mockClient;

      const result = await adapter.createBucket('existing-bucket');

      expect(mockClient.bucketExists).toHaveBeenCalledWith('existing-bucket');
      expect(mockClient.makeBucket).not.toHaveBeenCalled();
      expect(result).toEqual({
        bucketName: 'existing-bucket',
        created: false,
        provider: 'minio',
      });
    });

    it('should return fallback on bucket creation error', async () => {
      const mockClient = {
        bucketExists: jest.fn().mockResolvedValue(false),
        makeBucket: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (adapter as any).client = mockClient;

      const result = await adapter.createBucket('error-bucket');

      expect(result).toEqual({
        bucketName: 'error-bucket',
        created: false,
        provider: 'null',
      });
    });

    it('should log when bucket is created', async () => {
      const mockClient = {
        bucketExists: jest.fn().mockResolvedValue(false),
        makeBucket: jest.fn().mockResolvedValue(undefined),
      };

      (adapter as any).client = mockClient;
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await adapter.createBucket('logged-bucket');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bucket created'),
      );
    });

    it('should log debug when bucket already exists', async () => {
      const mockClient = {
        bucketExists: jest.fn().mockResolvedValue(true),
      };

      (adapter as any).client = mockClient;
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');

      await adapter.createBucket('existing-bucket');

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists'),
      );
    });

    it('should log error on failure', async () => {
      const mockClient = {
        bucketExists: jest.fn().mockResolvedValue(false),
        makeBucket: jest.fn().mockRejectedValue(new Error('Access denied')),
      };

      (adapter as any).client = mockClient;
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await adapter.createBucket('fail-bucket');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create bucket'),
      );
    });
  });
});
