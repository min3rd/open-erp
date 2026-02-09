import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@shared/authz';
import { ok, created, updated, deleted, paginated } from '@shared/response';
import { FileService } from '../services/file.service';
import {
  UpdateFileMetadataDto,
  CopyFileDto,
  MoveFileDto,
  BulkDeleteDto,
  ListFilesQueryDto,
} from '../dto';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const result = await this.fileService.upload(
      file,
      user?.userId,
      user?.organizationId,
    );
    return created(result, 'File uploaded successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List files with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of files' })
  async listFiles(@Query() query: ListFilesQueryDto) {
    const { items, total } = await this.fileService.listFiles(query);
    return paginated(items, query.page || 1, query.size || 20, total);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file details by ID' })
  @ApiResponse({ status: 200, description: 'File details' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(@Param('id') id: string) {
    const file = await this.fileService.getFileById(id);
    return ok(file);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List file versions' })
  @ApiResponse({ status: 200, description: 'File versions' })
  async listVersions(@Param('id') id: string) {
    const versions = await this.fileService.listVersions(id);
    return ok(versions);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update file metadata' })
  @ApiResponse({ status: 200, description: 'File metadata updated' })
  async updateMetadata(
    @Param('id') id: string,
    @Body() dto: UpdateFileMetadataDto,
  ) {
    const file = await this.fileService.updateFileMetadata(id, dto);
    return updated(file, 'File metadata updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a file' })
  @ApiResponse({ status: 200, description: 'File soft deleted' })
  async softDelete(@Param('id') id: string) {
    await this.fileService.softDelete(id);
    return deleted('File deleted successfully');
  }

  @Delete(':id/hard')
  @ApiOperation({ summary: 'Hard delete a file (admin only)' })
  @ApiResponse({ status: 200, description: 'File permanently deleted' })
  async hardDelete(@Param('id') id: string) {
    const result = await this.fileService.hardDelete(id);
    return deleted('File permanently deleted');
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy a file to a new location' })
  @ApiResponse({ status: 201, description: 'File copied' })
  async copyFile(@Param('id') id: string, @Body() dto: CopyFileDto) {
    const file = await this.fileService.copyFile(id, dto);
    return created(file, 'File copied successfully');
  }

  @Post(':id/move')
  @ApiOperation({ summary: 'Move a file to a new location' })
  @ApiResponse({ status: 200, description: 'File moved' })
  async moveFile(@Param('id') id: string, @Body() dto: MoveFileDto) {
    const file = await this.fileService.moveFile(id, dto);
    return updated(file, 'File moved successfully');
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete files' })
  @ApiResponse({ status: 200, description: 'Files deleted' })
  async bulkDelete(@Body() dto: BulkDeleteDto) {
    const result = await this.fileService.bulkDelete(dto.ids, dto.hard);
    return ok(result, 'Files deleted successfully');
  }
}
