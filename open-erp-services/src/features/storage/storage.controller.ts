/// <reference types="multer" />
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../../core/storage/storage.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('module') moduleName: string = 'general',
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          messageKey: 'storage.file_required',
        },
      });
    }

    const tenantId = req.tenantId || null;
    const sysFile = await this.storageService.uploadFile(
      tenantId,
      moduleName,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    return {
      success: true,
      data: {
        fileId: sysFile.id,
        fileName: sysFile.fileName,
        mimeType: sysFile.mimeType,
        fileSize: Number(sysFile.fileSize),
      },
    };
  }

  @Get('files/:fileId/download')
  async downloadFile(@Param('fileId') fileId: string, @Req() req: any) {
    const tenantId = req.tenantId || null;
    const downloadUrl = await this.storageService.getPresignedDownloadUrl(fileId, tenantId);

    return {
      success: true,
      data: {
        downloadUrl,
      },
    };
  }
}
