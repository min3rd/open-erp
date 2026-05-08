import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard, TenantGuard, CurrentUser } from '@shared/authz';
import type { UserContext } from '@shared/authz';

@ApiTags('workdoc-documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('workdoc/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách tài liệu của tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu' })
  async findAll(
    @CurrentUser() user: UserContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.documentService.findAll(user.organizationId!, page, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo tài liệu mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentService.create(user.organizationId!, dto, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết tài liệu' })
  @ApiResponse({ status: 200, description: 'Chi tiết tài liệu' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    return this.documentService.findOne(user.organizationId!, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tài liệu' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentService.update(user.organizationId!, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa tài liệu' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(
    @CurrentUser() user: UserContext,
    @Param('id') id: string,
  ) {
    await this.documentService.remove(user.organizationId!, id);
    return { success: true };
  }
}
