import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MinioService } from '@shared/services/minio/minio.service';
import { FileRepository } from '../repositories/file.repository';
import {
  UpdateFileMetadataDto,
  ListFilesQueryDto,
  CopyFileDto,
  MoveFileDto,
} from '../dto';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly minioService: MinioService,
    private readonly fileRepository: FileRepository,
  ) {}

  /**
   * Upload a file (server-side multipart upload)
   */
  async upload(
    file: Express.Multer.File,
    uploadedBy?: string,
    organizationId?: string,
  ) {
    const timestamp = Date.now();
    const key = organizationId
      ? `files/${organizationId}/${timestamp}-${file.originalname}`
      : `files/global/${timestamp}-${file.originalname}`;

    const uploadResult = await this.minioService.upload(key, file.buffer, {
      contentType: file.mimetype,
      size: file.size,
      originalFilename: file.originalname,
      uploadedBy,
    });

    const fileRecord = await this.fileRepository.create({
      key: uploadResult.key,
      filename: file.originalname,
      url: uploadResult.url,
      contentType: file.mimetype,
      size: file.size,
      uploadedBy,
      uploadedAt: new Date(),
      version: 1,
      minioVersionId: uploadResult.versionId,
      bucket: uploadResult.bucket,
      organizationId,
    });

    // Create initial version record
    await this.fileRepository.createVersion({
      fileId: fileRecord._id as any,
      version: 1,
      key: uploadResult.key,
      minioVersionId: uploadResult.versionId,
      size: file.size,
      contentType: file.mimetype,
      createdBy: uploadedBy,
      reason: 'Initial upload',
    });

    return {
      fileId: fileRecord._id,
      key: uploadResult.key,
      url: uploadResult.url,
      metadata: {
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        version: 1,
      },
    };
  }

  /**
   * Generate presigned upload URL
   */
  async presignUpload(key: string, expiry?: number) {
    const result = await this.minioService.presignUpload(key, {
      expiresIn: expiry,
    });

    return {
      uploadUrl: result.url,
      method: result.method,
      expiresAt: result.expiresAt,
      objectKey: key,
      bucket: this.minioService.getDefaultBucket(),
    };
  }

  /**
   * Generate presigned download URL
   */
  async presignDownload(key: string, expiry?: number) {
    const result = await this.minioService.presignDownload(key, {
      expiresIn: expiry,
    });

    return {
      downloadUrl: result.url,
      expiresAt: result.expiresAt,
      objectKey: key,
    };
  }

  /**
   * Get file by ID
   */
  async getFileById(id: string) {
    const file = await this.fileRepository.findById(id);
    if (!file || file.isDeleted) {
      throw new NotFoundException(`File with id ${id} not found`);
    }
    return file;
  }

  /**
   * List files with filtering and pagination
   */
  async listFiles(query: ListFilesQueryDto) {
    const page = query.page || 1;
    const limit = query.size || 20;

    const filter: Record<string, any> = {};
    if (query.tag) {
      filter.tags = query.tag;
    }
    if (query.contentType) {
      filter.contentType = { $regex: query.contentType, $options: 'i' };
    }
    if (query.uploadedBy) {
      filter.uploadedBy = query.uploadedBy;
    }

    return this.fileRepository.findAll(filter, page, limit);
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(id: string, dto: UpdateFileMetadataDto) {
    const file = await this.getFileById(id);
    const updateData: Record<string, any> = {};

    if (dto.filename !== undefined) updateData.filename = dto.filename;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    const updated = await this.fileRepository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundException(`File with id ${id} not found`);
    }
    return updated;
  }

  /**
   * Soft delete a file
   */
  async softDelete(id: string) {
    const file = await this.getFileById(id);
    await this.minioService.deleteObject(file.key, { softDelete: true });
    return this.fileRepository.softDelete(id);
  }

  /**
   * Hard delete a file (admin only)
   */
  async hardDelete(id: string) {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new NotFoundException(`File with id ${id} not found`);
    }
    await this.minioService.deleteObject(file.key);
    await this.fileRepository.hardDelete(id);
    return { deleted: true };
  }

  /**
   * Copy a file
   */
  async copyFile(id: string, dto: CopyFileDto) {
    const file = await this.getFileById(id);

    const copyResult = await this.minioService.copyObject(
      file.key,
      dto.destinationKey,
    );

    const newFile = await this.fileRepository.create({
      key: copyResult.key,
      filename: file.filename,
      url: copyResult.url,
      contentType: file.contentType,
      size: file.size,
      uploadedBy: file.uploadedBy,
      uploadedAt: new Date(),
      version: 1,
      bucket: copyResult.bucket,
      metadata: file.metadata,
      tags: file.tags,
      organizationId: file.organizationId,
    });

    return newFile;
  }

  /**
   * Move a file
   */
  async moveFile(id: string, dto: MoveFileDto) {
    const file = await this.getFileById(id);

    const moveResult = await this.minioService.moveObject(
      file.key,
      dto.destinationKey,
    );

    const updated = await this.fileRepository.updateById(id, {
      key: moveResult.key,
      url: moveResult.url,
    });

    return updated;
  }

  /**
   * Bulk delete files
   */
  async bulkDelete(ids: string[], hard: boolean = false) {
    if (hard) {
      // Hard delete: remove from MinIO and DB
      for (const id of ids) {
        try {
          const file = await this.fileRepository.findById(id);
          if (file) {
            await this.minioService.deleteObject(file.key);
          }
        } catch (err) {
          this.logger.warn(`Failed to delete MinIO object for file ${id}: ${err.message}`, err.stack);
        }
      }
      const count = await this.fileRepository.bulkHardDelete(ids);
      return { deletedCount: count };
    } else {
      const count = await this.fileRepository.bulkSoftDelete(ids);
      return { deletedCount: count };
    }
  }

  /**
   * List versions of a file
   */
  async listVersions(id: string) {
    await this.getFileById(id);
    return this.fileRepository.findVersionsByFileId(id);
  }

  /**
   * Get MinIO health status
   */
  async getMinioHealth() {
    return this.minioService.healthCheck();
  }
}
