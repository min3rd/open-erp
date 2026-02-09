import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from '../src/controllers/product.controller';
import { ProductService } from '../src/services/product.service';
import { MinioService } from '@shared/services/minio/minio.service';
import { AuthorizationService } from '@shared/authz/authorization.service';

describe('ProductController - Presigned URL', () => {
  let controller: ProductController;
  let minioService: jest.Mocked<Partial<MinioService>>;

  beforeEach(async () => {
    minioService = {
      presignUpload: jest.fn().mockResolvedValue({
        url: 'http://localhost:9000/presigned',
        method: 'PUT',
        expiresAt: new Date(),
      }),
      getDefaultBucket: jest.fn().mockReturnValue('open-erp'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              _id: 'prod-123',
              organizationId: { _id: 'org-456', toString: () => 'org-456' },
            }),
          },
        },
        { provide: MinioService, useValue: minioService },
        { provide: AuthorizationService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  describe('getPresignedUploadUrlForCreate', () => {
    it('should not include [object Object] in object key when organizationId is an object', async () => {
      const user = {
        userId: 'user-123',
        // Simulate organizationId as an object (like MongoDB ObjectId)
        organizationId: { _id: 'org-789', toString: () => 'org-789' },
      };

      const result = await controller.getPresignedUploadUrlForCreate(
        'test.jpg',
        'image/jpeg',
        'media',
        undefined,
        user as any,
      );

      // Verify the object key does not contain [object Object]
      expect(result.data.item.objectKey).not.toContain('[object Object]');
      expect(result.data.item.objectKey).not.toContain('[object');
      
      // Verify the object key contains the correct org ID
      expect(result.data.item.objectKey).toContain('org-org-789');
      expect(result.data.item.objectKey).toMatch(/^products\/temp\/org-org-789\/media\/\d+-test\.jpg$/);
    });

    it('should handle string organizationId correctly', async () => {
      const user = {
        userId: 'user-123',
        organizationId: 'org-string-456',
      };

      const result = await controller.getPresignedUploadUrlForCreate(
        'doc.pdf',
        'application/pdf',
        'media',
        undefined,
        user as any,
      );

      expect(result.data.item.objectKey).toContain('org-org-string-456');
      expect(result.data.item.objectKey).not.toContain('[object Object]');
    });

    it('should handle global organization correctly', async () => {
      const user = {
        userId: 'user-123',
        organizationId: undefined,
      };

      const result = await controller.getPresignedUploadUrlForCreate(
        'file.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'media',
        undefined,
        user as any,
      );

      expect(result.data.item.objectKey).toContain('global');
      expect(result.data.item.objectKey).not.toContain('org-');
      expect(result.data.item.objectKey).not.toContain('[object Object]');
    });

    it('should prioritize query organizationId over user organizationId', async () => {
      const user = {
        userId: 'user-123',
        organizationId: 'org-from-user',
      };

      const result = await controller.getPresignedUploadUrlForCreate(
        'image.png',
        'image/png',
        'thumbnail',
        'org-from-query',
        user as any,
      );

      expect(result.data.item.objectKey).toContain('org-org-from-query');
      expect(result.data.item.objectKey).not.toContain('org-from-user');
    });
  });
});
