import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { StorageService } from '../../core/storage/storage.service';
import { ConfigService } from '@nestjs/config';

@Controller('files')
export class FilesController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  @Get(':fileId/onlyoffice-config')
  @UseGuards(JwtAuthGuard)
  async getOnlyOfficeConfig(
    @Param('fileId') fileId: string,
    @Query('mode') mode: string = 'view',
    @Req() req: any,
  ) {
    const tenantId = req.tenantId || null;
    const file = await this.storageService.getFileById(fileId);
    if (!file) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          messageKey: 'storage.file_not_found',
        },
      });
    }

    if (file.tenantId && file.tenantId !== tenantId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'TENANT_MISMATCH',
          messageKey: 'storage.access_denied',
        },
      });
    }

    const ext = this.getFileExtension(file.fileName);
    const docType = this.getDocumentType(ext);

    const backendUrl = this.configService.get<string>(
      'ONLYOFFICE_BACKEND_URL',
      'http://localhost:3000',
    );
    const downloadUrl = `${backendUrl}/api/v1/files/${file.id}/download-binary`;
    const callbackUrl = `${backendUrl}/api/v1/files/onlyoffice-callback/${file.id}`;

    return {
      success: true,
      data: {
        document: {
          fileType: ext,
          key: `${file.id}-${file.createdAt.getTime()}`,
          title: file.fileName,
          url: downloadUrl,
        },
        editorConfig: {
          mode: mode === 'edit' ? 'edit' : 'view',
          lang: 'vi',
          callbackUrl: callbackUrl,
          user: {
            id: req.user?.userId || 'anonymous',
            name: req.user?.email || 'User',
          },
        },
        documentType: docType,
      },
    };
  }

  @Post('onlyoffice-callback/:fileId')
  async onlyOfficeCallback(@Param('fileId') fileId: string, @Body() body: any) {
    // OnlyOffice Server status 2 (ready for saving) or 6 (force save)
    if (body.status === 2 || body.status === 6) {
      const fileUrl = body.url;
      if (!fileUrl) {
        return { error: 0 };
      }

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file from OnlyOffice callback: ${fileUrl}`);
      }

      const file = await this.storageService.getFileById(fileId);
      if (!file) {
        throw new NotFoundException({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            messageKey: 'storage.file_not_found',
          },
        });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await this.storageService.updateFile(file.id, file.tenantId, buffer);
    }

    return { error: 0 };
  }

  @Get(':fileId/download-binary')
  async downloadBinary(@Param('fileId') fileId: string, @Res() res: any) {
    const { stream, fileName, mimeType } = await this.storageService.getFileStream(fileId, null);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // Stream the file back
    stream.pipe(res);
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
  }

  private getDocumentType(ext: string): string {
    const wordExts = ['docx', 'doc', 'odt', 'rtf', 'txt', 'pdf'];
    const cellExts = ['xlsx', 'xls', 'csv', 'ods'];
    const slideExts = ['pptx', 'ppt', 'odp'];

    const normalized = ext.toLowerCase();
    if (wordExts.includes(normalized)) return 'word';
    if (cellExts.includes(normalized)) return 'cell';
    if (slideExts.includes(normalized)) return 'slide';
    return 'word';
  }
}
