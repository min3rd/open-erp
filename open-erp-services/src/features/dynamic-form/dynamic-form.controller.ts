import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DynamicFormService } from '../../core/dynamic-form/dynamic-form.service';
import { JwtAuthGuard } from '../../core/auth/auth.guard';

@Controller('dynamic-forms')
@UseGuards(JwtAuthGuard)
export class DynamicFormController {
  constructor(private readonly dynamicFormService: DynamicFormService) {}

  /**
   * POST /api/v1/dynamic-forms
   * Tạo form mới hoặc tạo phiên bản mới nếu formKey đã tồn tại
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrUpdate(@Body() body: any, @Req() req: any) {
    const tenantId = req.tenantId;
    const form = await this.dynamicFormService.createOrUpdateForm(tenantId, {
      ...body,
      layout: body.layout || body.meta || null,
    });
    return {
      success: true,
      data: {
        id: form.id,
        formKey: form.formKey,
        name: form.name,
        version: form.version,
        isLatest: form.isLatest,
        createdAt: form.createdAt,
      },
    };
  }

  /**
   * GET /api/v1/dynamic-forms/key/:key
   * Lấy phiên bản mới nhất của form theo formKey
   */
  @Get('key/:key')
  async getLatestByKey(@Param('key') key: string, @Req() req: any) {
    const tenantId = req.tenantId;
    const form = await this.dynamicFormService.getLatestByKey(key, tenantId);
    return {
      success: true,
      data: {
        id: form.id,
        formKey: form.formKey,
        name: form.name,
        description: form.description,
        version: form.version,
        isLatest: form.isLatest,
        createdAt: form.createdAt,
        fields: form.fields,
        meta: form.layout || {},
      },
    };
  }

  /**
   * GET /api/v1/dynamic-forms/key/:key/versions
   * Lấy lịch sử tất cả các phiên bản của một form theo formKey
   */
  @Get('key/:key/versions')
  async getVersions(@Param('key') key: string, @Req() req: any) {
    const tenantId = req.tenantId;
    const versions = await this.dynamicFormService.getVersionsByKey(key, tenantId);
    return {
      success: true,
      data: versions.map((f) => ({
        id: f.id,
        formKey: f.formKey,
        name: f.name,
        version: f.version,
        isLatest: f.isLatest,
        createdAt: f.createdAt,
      })),
    };
  }

  /**
   * POST /api/v1/dynamic-forms/:id/restore
   * Khôi phục phiên bản cũ, clone thành version mới nhất
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.tenantId;
    const restored = await this.dynamicFormService.restoreVersion(id, tenantId);
    return {
      success: true,
      data: {
        id: restored.id,
        formKey: restored.formKey,
        version: restored.version,
        isLatest: restored.isLatest,
        restoredFromVersion: (restored as any).restoredFromVersion,
      },
    };
  }

  /**
   * POST /api/v1/dynamic-forms/:id/validate
   * Validate dữ liệu người dùng nhập vào theo định nghĩa schema của form version đó
   */
  @Post(':id/validate')
  @HttpCode(HttpStatus.OK)
  async validateData(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const tenantId = req.tenantId;
    const result = await this.dynamicFormService.validateData(id, tenantId, data);

    if (!result.valid) {
      return {
        success: false,
        errors: result.errors,
      };
    }

    return {
      success: true,
      messageKey: 'dynamic_form.validation_passed',
    };
  }
}
