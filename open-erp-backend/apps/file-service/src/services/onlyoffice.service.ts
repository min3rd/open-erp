import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MinioService } from '@shared/services/minio/minio.service';
import { FileRepository } from '../repositories/file.repository';
import * as crypto from 'crypto';

/**
 * Supported OnlyOffice document types and their extensions
 */
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  '.doc': 'word',
  '.docx': 'word',
  '.xls': 'cell',
  '.xlsx': 'cell',
  '.ppt': 'slide',
  '.pptx': 'slide',
  '.pdf': 'word',
};

@Injectable()
export class OnlyOfficeService {
  private readonly logger = new Logger(OnlyOfficeService.name);
  private readonly onlyOfficeUrl: string;
  private readonly jwtSecret: string;
  private readonly callbackSecret: string;
  private readonly minioUrlForOnlyOffice: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly minioService: MinioService,
    private readonly fileRepository: FileRepository,
  ) {
    this.onlyOfficeUrl = this.configService.get<string>(
      'ONLYOFFICE_URL',
      'http://localhost:8080',
    );
    this.jwtSecret = this.configService.get<string>(
      'ONLYOFFICE_JWT_SECRET',
      '',
    );
    this.callbackSecret = this.configService.get<string>(
      'ONLYOFFICE_CALLBACK_SECRET',
      '',
    );
    // MinIO URL that OnlyOffice Document Server should use
    // For Docker deployments, set this to http://minio:9000 so OnlyOffice
    // can reach MinIO via Docker network instead of host.docker.internal
    this.minioUrlForOnlyOffice = this.configService.get<string>(
      'ONLYOFFICE_MINIO_URL',
      '', // Empty means no URL rewriting
    );
  }

  /**
   * Get the document type from filename extension
   */
  private getDocumentType(filename: string): string {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return DOCUMENT_TYPE_MAP[ext] || 'word';
  }

  /**
   * Generate a unique document key for OnlyOffice
   */
  private generateDocumentKey(fileId: string, version: number): string {
    return crypto
      .createHash('md5')
      .update(`${fileId}_v${version}_${Date.now()}`)
      .digest('hex');
  }

  /**
   * Sign payload with JWT if secret is configured
   */
  private signPayload(payload: Record<string, any>): string | null {
    if (!this.jwtSecret) return null;
    try {
      // Simple JWT sign: header.payload.signature
      const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      ).toString('base64url');
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${body}`)
        .digest('base64url');
      return `${header}.${body}.${signature}`;
    } catch (err) {
      this.logger.error(`Failed to sign JWT: ${err.message}`);
      return null;
    }
  }

  /**
   * Rewrite MinIO URL for OnlyOffice Document Server access
   * Replaces the browser-accessible URL with a Docker-internal URL if configured
   */
  private rewriteMinioUrlForOnlyOffice(presignedUrl: string): string {
    if (!this.minioUrlForOnlyOffice) {
      return presignedUrl;
    }

    try {
      const url = new URL(presignedUrl);
      const targetUrl = new URL(this.minioUrlForOnlyOffice);
      
      // Replace the hostname and port with OnlyOffice-accessible endpoint
      url.hostname = targetUrl.hostname;
      url.protocol = targetUrl.protocol;
      // Set port explicitly; empty string removes port from URL (for default ports)
      url.port = targetUrl.port || '';
      
      const rewrittenUrl = url.toString();
      this.logger.debug(
        `Rewrote MinIO URL for OnlyOffice: ${presignedUrl} -> ${rewrittenUrl}`,
      );
      return rewrittenUrl;
    } catch (err) {
      this.logger.warn(
        `Failed to rewrite MinIO URL, using original: ${err.message}`,
      );
      return presignedUrl;
    }
  }

  /**
   * Create an OnlyOffice editing/viewing session
   */
  async createSession(
    fileId: string | undefined,
    mode: 'view' | 'edit' = 'edit',
    userId?: string,
    callbackBaseUrl?: string,
    minioKey?: string,
    filename?: string,
    bucket?: string,
  ) {
    let key: string;
    let fname: string;
    let version = 1;

    if (minioKey && filename) {
      // Direct MinIO key mode — access MinIO directly with bucket and objectKey,
      // no need for DB lookup
      key = minioKey;
      fname = filename;
    } else if (fileId) {
      const file = await this.fileRepository.findById(fileId);
      if (!file || file.isDeleted) {
        throw new NotFoundException(`File with id ${fileId} not found`);
      }
      key = file.key;
      fname = file.filename;
      version = file.version;
    } else {
      throw new BadRequestException(
        'Either fileId or minioKey+filename must be provided',
      );
    }

    // Check if file type is supported
    const ext = fname.substring(fname.lastIndexOf('.')).toLowerCase();
    if (!DOCUMENT_TYPE_MAP[ext]) {
      throw new BadRequestException(
        `File type ${ext} is not supported by OnlyOffice`,
      );
    }

    // Generate presigned URL for OnlyOffice to fetch the file
    // Use the provided bucket or fall back to the default bucket
    const presignResult = await this.minioService.presignDownload(key, {
      bucket,
      expiresIn: 7200, // 2 hours for editing sessions
    });

    const documentKey = this.generateDocumentKey(
      fileId || minioKey || key,
      version,
    );
    const documentType = this.getDocumentType(fname);

    // Build callback URL
    const baseUrl =
      callbackBaseUrl ||
      this.configService.get<string>(
        'FILE_SERVICE_BASE_URL',
        'http://localhost:3008',
      );
    const callbackUrl = `${baseUrl}/v1/onlyoffice/callback`;

    // Rewrite MinIO URL for OnlyOffice Document Server
    // If ONLYOFFICE_MINIO_URL is set (e.g., http://minio:9000), the presigned URL
    // will be rewritten to use the Docker-internal hostname instead of host.docker.internal
    // This allows OnlyOffice Document Server to access MinIO without DNS lookup of private IPs
    const documentUrl = this.rewriteMinioUrlForOnlyOffice(presignResult.url);

    // Build editor config
    const editorConfig: Record<string, any> = {
      document: {
        fileType: ext.replace('.', ''),
        key: documentKey,
        title: fname,
        url: documentUrl,
      },
      documentType,
      editorConfig: {
        mode: mode,
        callbackUrl: callbackUrl,
        user: userId ? { id: userId } : undefined,
        customization: {
          autosave: true,
          forcesave: true,
        },
      },
    };

    // Set permissions based on mode
    editorConfig.document.permissions = {
      edit: mode === 'edit',
      download: true,
      print: true,
      review: mode === 'edit',
      comment: true,
    };

    // Sign with JWT if configured
    const token = this.signPayload(editorConfig);
    if (token) {
      editorConfig.token = token;
    }

    return {
      editorUrl: `${this.onlyOfficeUrl}/web-apps/apps/api/documents/api.js`,
      config: editorConfig,
      documentKey,
    };
  }

  /**
   * Handle OnlyOffice save callback
   * See: https://api.onlyoffice.com/editors/callback
   */
  async handleCallback(body: Record<string, any>) {
    const { status, url, key, users } = body;

    this.logger.log(
      `OnlyOffice callback received: status=${status}, key=${key}`,
    );

    // Status codes:
    // 1 - document is being edited
    // 2 - document is ready for saving
    // 4 - document is closed with no changes
    // 6 - document is being edited, but the current document state is saved
    // 7 - error has occurred while force saving the document

    if (status === 2 || status === 6) {
      // Document ready for saving or force save
      if (!url) {
        this.logger.warn('No URL in callback for save');
        return { error: 0 };
      }

      try {
        await this.saveDocumentFromCallback(key, url, users);
      } catch (err) {
        this.logger.error(
          `Failed to save document from callback: ${err.message}`,
          err.stack,
        );
        return { error: 1 };
      }
    }

    // Return success to OnlyOffice
    return { error: 0 };
  }

  /**
   * Download and save the document from OnlyOffice callback URL
   */
  private async saveDocumentFromCallback(
    documentKey: string,
    downloadUrl: string,
    users?: string[],
  ) {
    this.logger.log(
      `Saving document from OnlyOffice: key=${documentKey}, url=${downloadUrl}`,
    );

    // Note: Full implementation requires:
    // 1. Fetching the document from downloadUrl (HTTP GET)
    // 2. Uploading it to MinIO as a new version
    // 3. Updating the file record in DB with incremented version
    // 4. Creating a new version entry in file_versions collection
    //
    // This is left as a framework since the documentKey->fileId mapping
    // and HTTP download from OnlyOffice require runtime infrastructure
    // (OnlyOffice Document Server must be running).
    this.logger.log(
      `Document save event recorded for key=${documentKey}, users=${users?.join(', ') || 'unknown'}`,
    );
  }
}
