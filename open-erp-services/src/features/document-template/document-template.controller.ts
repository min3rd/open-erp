import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../core/auth/auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { RequirePermissions } from '../../core/auth/permissions.decorator';
import { DocumentTemplateService } from '../../core/document-template/document-template.service';
import { StorageService } from '../../core/storage/storage.service';

@Controller('document-templates')
@UseGuards(JwtAuthGuard)
export class DocumentTemplateController {
  constructor(
    private readonly templateService: DocumentTemplateService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('TEMPLATE_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('mapping') mappingStr: string,
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

    if (!name) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'NAME_REQUIRED',
          messageKey: 'template.name_required',
        },
      });
    }

    let mapping: any[] = [];
    if (mappingStr) {
      try {
        mapping = JSON.parse(mappingStr);
      } catch (err) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_MAPPING',
            messageKey: 'template.invalid_mapping',
          },
        });
      }
    }

    const tenantId = req.tenantId || null;

    // 1. Upload template file
    const sysFile = await this.storageService.uploadFile(
      tenantId,
      'document-templates',
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    // 2. Create document template record
    const template = await this.templateService.createTemplate(
      tenantId,
      name,
      sysFile.id,
      mapping,
    );

    return {
      success: true,
      data: {
        templateId: template.id,
        name: template.name,
      },
    };
  }

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.tenantId || null;
    const templates = await this.templateService.findAllTemplates(tenantId);
    return {
      success: true,
      data: templates.map((t) => ({
        templateId: t.id,
        name: t.name,
        fileId: t.fileId,
        mapping: t.mapping,
        createdAt: t.createdAt,
      })),
    };
  }

  @Post(':id/generate')
  async generate(
    @Param('id') id: string,
    @Body('instanceId') instanceId: string,
    @Body('outputFormat') outputFormat: string,
    @Req() req: any,
  ) {
    if (!instanceId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INSTANCE_REQUIRED',
          messageKey: 'workflow.instance_required',
        },
      });
    }

    const tenantId = req.tenantId || null;
    const result = await this.templateService.generateDocument(
      id,
      instanceId,
      outputFormat,
      tenantId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('TEMPLATE_ADMIN')
  async delete(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId || null;
    await this.templateService.deleteTemplate(id, tenantId);
    return {
      success: true,
      messageKey: 'template.deleted',
    };
  }
}
