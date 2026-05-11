import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AvatarService {
  private client: Minio.Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  async uploadAvatar(params: {
    tenantId: string;
    userId: string;
    file: any;
  }): Promise<{ avatarUrl: string; metadata: Record<string, unknown> }> {
    this.assertFile(params.file);

    const bucketName = `tenant-${params.tenantId}`;
    const ext = this.resolveExtension(params.file.mimetype);
    const objectName = `avatars/${params.userId}-${Date.now()}-${uuidv4()}.${ext}`;
    const avatarUrl = `${bucketName}/${objectName}`;

    const client = this.getClient();
    if (client) {
      await this.ensureBucket(client, bucketName);
      await client.putObject(
        bucketName,
        objectName,
        params.file.buffer,
        params.file.size,
        {
          'Content-Type': params.file.mimetype,
        },
      );
    }

    return {
      avatarUrl,
      metadata: {
        bucketName,
        objectName,
        originalName: params.file.originalname,
        mimeType: params.file.mimetype,
        size: params.file.size,
      },
    };
  }

  private assertFile(file: any): void {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          key: 'user.avatar.invalid_type',
          data: { mimeType: file.mimetype },
        },
      });
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          key: 'user.avatar.too_large',
          data: { maxSizeBytes: 5 * 1024 * 1024 },
        },
      });
    }
  }

  private resolveExtension(mimeType: string): string {
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    return 'jpg';
  }

  private getClient(): Minio.Client | null {
    if (this.client) {
      return this.client;
    }

    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    if (!endpoint || !accessKey || !secretKey) {
      return null;
    }

    this.client = new Minio.Client({
      endPoint: endpoint,
      port: this.configService.get<number>('MINIO_PORT') ?? 9000,
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey,
      secretKey,
    });

    return this.client;
  }

  private async ensureBucket(
    client: Minio.Client,
    bucketName: string,
  ): Promise<void> {
    const exists = await client.bucketExists(bucketName).catch(() => false);
    if (!exists) {
      await client.makeBucket(bucketName).catch(() => undefined);
    }
  }
}
