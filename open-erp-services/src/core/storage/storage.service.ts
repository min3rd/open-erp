import { Injectable, OnModuleInit, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysFile } from './file.entity';
import * as crypto from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SysFile)
    private readonly fileRepository: Repository<SysFile>,
  ) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000');
    const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretAccessKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadminpassword');
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'erp-tenant-assets');

    this.s3Client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Bắt buộc đối với MinIO
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      this.logger.log(`Bucket '${this.bucketName}' đã tồn tại và sẵn sàng.`);
    } catch (error: any) {
      if (error.name === 'NotFound' || error['$metadata']?.httpStatusCode === 404) {
        this.logger.log(`Bucket '${this.bucketName}' không tồn tại. Đang tiến hành tạo mới...`);
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
          this.logger.log(`Bucket '${this.bucketName}' được tạo thành công.`);
        } catch (createError) {
          this.logger.error(`Tạo bucket '${this.bucketName}' thất bại:`, createError);
        }
      } else {
        this.logger.error(`Lỗi kiểm tra bucket:`, error);
      }
    }
  }

  async uploadFile(
    tenantId: string | null,
    moduleName: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<SysFile> {
    const fileId = crypto.randomUUID();
    const objectKey = `${tenantId || 'global'}/${moduleName}/${fileId}_${fileName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const sysFile = new SysFile();
    sysFile.id = fileId;
    sysFile.tenantId = tenantId;
    sysFile.bucketName = this.bucketName;
    sysFile.objectKey = objectKey;
    sysFile.fileName = fileName;
    sysFile.mimeType = mimeType;
    sysFile.fileSize = buffer.length;

    return this.fileRepository.save(sysFile);
  }

  async getPresignedDownloadUrl(fileId: string, tenantId: string | null): Promise<string> {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Tài liệu không tồn tại',
        },
      });
    }

    if (file.tenantId && file.tenantId !== tenantId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'TENANT_MISMATCH',
          message: 'Quyền truy cập tệp tin bị từ chối',
        },
      });
    }

    const command = new GetObjectCommand({
      Bucket: file.bucketName,
      Key: file.objectKey,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 900 }); // Hiệu lực trong 15 phút
  }

  async deleteFile(fileId: string, tenantId: string | null): Promise<void> {
    const file = await this.fileRepository.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Tài liệu không tồn tại',
        },
      });
    }

    if (file.tenantId && file.tenantId !== tenantId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'TENANT_MISMATCH',
          message: 'Quyền truy cập tệp tin bị từ chối',
        },
      });
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: file.bucketName,
        Key: file.objectKey,
      }),
    );

    await this.fileRepository.remove(file);
  }

  async getFileById(fileId: string): Promise<SysFile | null> {
    return this.fileRepository.findOne({ where: { id: fileId } });
  }
}
