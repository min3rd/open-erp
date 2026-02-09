import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/authz';
import { ok } from '@shared/response';
import { FileService } from '../services/file.service';
import { PresignUploadQueryDto, PresignDownloadQueryDto } from '../dto';

@ApiTags('presign')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('presign')
export class PresignController {
  constructor(private readonly fileService: FileService) {}

  @Get('upload')
  @ApiOperation({ summary: 'Get presigned URL for uploading' })
  @ApiResponse({ status: 200, description: 'Presigned upload URL' })
  async presignUpload(@Query() query: PresignUploadQueryDto) {
    const result = await this.fileService.presignUpload(
      query.key,
      query.expiry,
    );
    return ok(result);
  }

  @Get('download')
  @ApiOperation({ summary: 'Get presigned URL for downloading' })
  @ApiResponse({ status: 200, description: 'Presigned download URL' })
  async presignDownload(@Query() query: PresignDownloadQueryDto) {
    const result = await this.fileService.presignDownload(
      query.key,
      query.expiry,
    );
    return ok(result);
  }
}
